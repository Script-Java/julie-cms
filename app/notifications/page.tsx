
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Bell, CheckSquare, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="p-8 text-white">Please log in to view notifications.</div>
    }

    const now = new Date()
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

    // Query tasks due today
    const { data: tasks } = await supabase
        .from('tasks')
        .select('*, clients(name)')
        .lte('due_at', endOfDay)
        .neq('status', 'completed')
        .order('due_at', { ascending: true })

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-white/10 rounded-full">
                    <Bell className="w-8 h-8 text-[#00E676]" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Notifications</h1>
                    <p className="text-gray-400">Stay updated on your priority items.</p>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-blue-500" />
                    Action Items Due Today ({tasks?.length || 0})
                </h2>

                <div className="grid gap-3">
                    {!tasks || tasks.length === 0 ? (
                        <div className="p-6 bg-[#151515] rounded-xl border border-white/10 text-center text-gray-500">
                            No notifications right now.
                        </div>
                    ) : (
                        tasks.map((task: any) => (
                            <div key={task.id} className="group p-4 bg-[#151515] rounded-xl border border-white/10 hover:border-[#00E676]/50 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${new Date(task.due_at) < new Date() ? 'bg-red-500' : 'bg-blue-500'}`} />
                                    <div>
                                        <h3 className="font-medium text-white group-hover:text-[#00E676]">{task.title}</h3>
                                        <div className="flex gap-4 text-sm text-gray-400 mt-1">
                                            {task.clients && <span>Client: {task.clients.name}</span>}
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(task.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Link href={`/tasks/${task.id}`}>
                                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-white transition-colors">
                                        View
                                    </button>
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
