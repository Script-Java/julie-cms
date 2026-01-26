'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';
import { Plus, ChevronLeft, ChevronRight, RefreshCw, Calendar as CalendarIcon, CheckSquare } from 'lucide-react';

interface ZohoEvent {
    uid: string;
    title: string;
    dateandtime: {
        start: string;
        end: string;
        timezone: string;
    };
    description?: string;
    location?: string;
    type: 'event';
}

interface Task {
    id: string;
    title: string;
    due_at: string;
    status: string;
    priority: string;
    type: 'task';
}

type CalendarItem = ZohoEvent | Task;

export default function CalendarPage() {
    const [events, setEvents] = useState<CalendarItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        fetchData();
    }, [currentDate]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch Zoho Events
            const zohoPromise = fetch('/api/zoho/calendar')
                .then(async res => {
                    if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        if (data.error?.includes('not_connected')) throw new Error('not_connected');
                        throw new Error(data.error || 'Failed to fetch events');
                    }
                    const data = await res.json();
                    return (data.events || []).map((e: any) => ({ ...e, type: 'event' }));
                })
                .catch(err => {
                    console.error('Zoho Fetch Error:', err);
                    if (err.message === 'not_connected') throw err;
                    return [];
                });

            // Fetch Tasks
            const tasksPromise = supabase
                .from('tasks')
                .select('*')
                .not('due_at', 'is', null)
                .then(({ data, error }) => {
                    if (error) throw error;
                    return (data || []).map((t: any) => ({ ...t, type: 'task' }));
                });

            const [zohoEvents, tasks] = await Promise.all([zohoPromise, tasksPromise]);

            setEvents([...zohoEvents, ...tasks]);
            setError(null);

        } catch (err: any) {
            console.error(err);
            if (err.message === 'not_connected') {
                setError('not_connected');
            }
            // Even if Zoho fails, we might want to show tasks? 
            // Let's rely on the fact that we return [] for Zoho errors unless it's strictly "not_connected"
            if (err.message !== 'not_connected') {
                console.error('Calendar Error Details:', err.message);
                // Optionally show toast or alert, but for now log it clearly.
                // We could set a separate error state to show a warning banner.
            }
        } finally {
            setLoading(false);
        }
    };


    // Calendar Helper Functions
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-32 bg-[#151515] border-r border-b border-zinc-800/50" />);
        }

        // Days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

            // Filter events for this day
            const dayEvents = events.filter(e => {
                let dateStr = '';
                if (e.type === 'event') {
                    dateStr = e.dateandtime.start;
                } else {
                    dateStr = e.due_at;
                }
                const d = new Date(dateStr);
                return d.getDate() === i && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
            });

            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), i).toDateString();

            days.push(
                <div key={i} className={`h-32 bg-[#151515] border-r border-b border-zinc-800/50 p-2 transition-colors hover:bg-zinc-900/50 group relative`}>
                    <div className={`flex justify-between items-start`}>
                        <span className={`text-sm font-medium ${isToday ? 'bg-[#00E676] text-black w-6 h-6 rounded-full flex items-center justify-center' : 'text-zinc-400'}`}>
                            {i}
                        </span>
                        {/* Add button hidden by default, shown on hover */}
                        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-800 rounded">
                            <Plus className="w-3 h-3 text-zinc-400" />
                        </button>
                    </div>

                    <div className="mt-2 space-y-1 overflow-y-auto max-h-[calc(100%-24px)] custom-scrollbar">
                        {dayEvents.map(ev => {
                            const isEvent = ev.type === 'event';
                            const time = isEvent
                                ? new Date((ev as ZohoEvent).dateandtime.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : 'Task';

                            return (
                                <div
                                    key={isEvent ? (ev as ZohoEvent).uid : (ev as Task).id}
                                    className={`text-xs p-1.5 rounded border-l-2 truncate cursor-pointer hover:absolute hover:z-10 hover:w-48 hover:shadow-xl
                                    ${isEvent
                                            ? 'bg-zinc-800/80 text-zinc-200 border-[#00E676] hover:bg-zinc-800'
                                            : 'bg-blue-900/40 text-blue-100 border-blue-500 hover:bg-blue-900'
                                        }
                                `}
                                >
                                    <div className="flex items-center gap-1">
                                        {!isEvent && <CheckSquare className="w-3 h-3 min-w-3" />}
                                        <span>{isEvent ? time : ''} {ev.title}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        return days;
    };

    if (error === 'not_connected') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="p-4 bg-zinc-900 rounded-full">
                    <CalendarIcon className="w-8 h-8 text-zinc-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Connect Your Calendar</h2>
                <p className="text-zinc-500 max-w-md text-center">
                    Connect your Zoho Workspace to view and manage your calendar events directly from here.
                </p>
                <Link href="/settings/integrations">
                    <Button className="bg-[#00E676] text-black hover:bg-[#00c853]">Go to Integrations</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold tracking-tight text-white">Calendar</h1>
                    <div className="flex items-center rounded-md border border-zinc-800 bg-[#151515] p-1">
                        <Button variant="ghost" size="sm" onClick={prevMonth} className="h-7 w-7 p-0">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="w-32 text-center text-sm font-medium">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </span>
                        <Button variant="ghost" size="sm" onClick={nextMonth} className="h-7 w-7 p-0">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button className="bg-[#00E676] text-black hover:bg-[#00c853]">
                        <Plus className="w-4 h-4 mr-2" />
                        New Event
                    </Button>
                </div>
            </div>

            <div className="flex-1 rounded-xl border border-zinc-800 bg-[#0a0a0a] overflow-hidden flex flex-col min-h-[600px]">
                {/* Header Row */}
                <div className="grid grid-cols-7 border-b border-zinc-800 bg-[#151515]">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-2 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                    {renderCalendarDays()}
                </div>
            </div>
        </div>
    );
}
