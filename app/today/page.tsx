
import { createClient } from '@/utils/supabase/server'
import { fetchInboxMessages } from '@/utils/zoho/mail'
import Link from 'next/link'
import { CheckSquare, Users, Mail, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function TodayPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="p-8 text-white">Please log in to view your dashboard.</div>
    }

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
    const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).toISOString()

    // 1. Tasks due today or earlier (overdue)
    const { data: tasks } = await supabase
        .from('tasks')
        .select('*, clients(name)')
        .lte('due_at', endOfDay)
        .neq('status', 'completed')
        .order('due_at', { ascending: true })
        .limit(20)

    // 2. Clients not contacted in 30+ days
    // Assuming 'last_contacted' is a field. If not, we might need another way, but let's assume based on request.
    const { data: staleClients } = await supabase
        .from('clients')
        .select('*')
        .lt('last_contacted', thirtyDaysAgo)
        .order('last_contacted', { ascending: true })
        .limit(10)

    // 3. New leads / Emails received today
    let recentEmails = []
    let emailError = null
    try {
        const allEmails = await fetchInboxMessages(user.id, 50)
        // Filter for today (local time roughly matched by server time)
        // Zoho `receivedTime` is usually timestamp in string or number
        const startOfDayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

        recentEmails = allEmails.filter((e: any) => {
            const t = Number(e.receivedTime)
            return t >= startOfDayTime
        })
    } catch (e) {
        console.error("Zoho fetch failed", e)
        emailError = "Could not fetch emails. Check integration."
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-white mb-8">Today's Overview</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

                {/* 1. Tasks Due Today */}
                <div className="bg-[#151515] border border-white/10 rounded-xl p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <CheckSquare className="w-5 h-5 text-blue-500" />
                            </div>
                            <h2 className="text-xl font-semibold text-white">Tasks Due</h2>
                        </div>
                        <Badge className="bg-white/10">{tasks?.length || 0}</Badge>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px]">
                        {!tasks || tasks.length === 0 ? (
                            <div className="text-gray-500 text-center py-8">No tasks due today. Good job!</div>
                        ) : (
                            tasks.map((task: any) => (
                                <Link href={`/tasks/${task.id}`} key={task.id} className="block group">
                                    <div className="p-3 bg-white/5 rounded-lg border border-white/5 group-hover:border-blue-500/50 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-medium text-white group-hover:text-blue-400 text-sm">{task.title}</h3>
                                            {new Date(task.due_at) < new Date() && (
                                                <span className="text-xs text-red-400 font-medium">Overdue</span>
                                            )}
                                        </div>
                                        {task.clients && (
                                            <p className="text-xs text-gray-400">Client: {task.clients.name}</p>
                                        )}
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                    <Link href="/tasks" className="mt-4 text-sm text-gray-400 hover:text-white flex items-center gap-1">
                        View all tasks <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>

                {/* 2. Stale Clients */}
                <div className="bg-[#151515] border border-white/10 rounded-xl p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <Users className="w-5 h-5 text-amber-500" />
                            </div>
                            <h2 className="text-xl font-semibold text-white">Needs Follow-up</h2>
                        </div>
                        <Badge className="bg-white/10">{staleClients?.length || 0}</Badge>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px]">
                        {!staleClients || staleClients.length === 0 ? (
                            <div className="text-gray-500 text-center py-8">Everyone has been contacted recently.</div>
                        ) : (
                            staleClients.map((client: any) => (
                                <Link href={`/clients/${client.id}`} key={client.id} className="block group">
                                    <div className="p-3 bg-white/5 rounded-lg border border-white/5 group-hover:border-amber-500/50 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-medium text-white group-hover:text-amber-400 text-sm">{client.name}</h3>
                                            <span className="text-xs text-gray-500">
                                                {Math.floor((new Date().getTime() - new Date(client.last_contacted).getTime()) / (1000 * 60 * 60 * 24))} days ago
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 truncate">{client.email}</p>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* 3. New Leads / Emails */}
                <div className="bg-[#151515] border border-white/10 rounded-xl p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Mail className="w-5 h-5 text-purple-500" />
                            </div>
                            <h2 className="text-xl font-semibold text-white">New Messages</h2>
                        </div>
                        <Badge className="bg-white/10">{recentEmails?.length || 0}</Badge>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px]">
                        {emailError ? (
                            <div className="text-red-400 text-sm text-center py-8">{emailError}</div>
                        ) : recentEmails.length === 0 ? (
                            <div className="text-gray-500 text-center py-8">No new emails today.</div>
                        ) : (
                            recentEmails.map((email: any) => (
                                <div key={email.messageId} className="p-3 bg-white/5 rounded-lg border border-white/5 hover:border-purple-500/50 transition-colors">
                                    <h3 className="font-medium text-white text-sm truncate">{email.subject}</h3>
                                    <p className="text-xs text-gray-400 mt-1 truncate">From: {email.fromAddress}</p>
                                    <p className="text-xs text-gray-500 mt-1">{new Date(Number(email.receivedTime)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
