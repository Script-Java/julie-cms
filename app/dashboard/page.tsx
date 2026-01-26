import { createClient } from '@/utils/supabase/server'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { TaskCard } from '@/components/dashboard/task-card'
import { FollowUpCard } from '@/components/dashboard/follow-up-card'
import { Clock, Calendar } from 'lucide-react'

export default async function DashboardPage() {
    const supabase = await createClient()

    // Calculate dates once
    const now = new Date()
    const nowIso = now.toISOString()

    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayStartIso = todayStart.toISOString()

    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)
    const todayEndIso = todayEnd.toISOString()

    const [
        { data: overdueTasks },
        { data: dueTodayTasks },
        { data: followups }
    ] = await Promise.all([
        // Fetch Overdue Tasks
        supabase
            .from('tasks')
            .select('*')
            .eq('status', 'open')
            .lt('due_at', nowIso)
            .order('due_at', { ascending: true })
            .limit(5),

        // Fetch Due Today
        supabase
            .from('tasks')
            .select('*')
            .eq('status', 'open')
            .gte('due_at', todayStartIso)
            .lte('due_at', todayEndIso)
            .order('due_at', { ascending: true }),

        // Fetch Follow-ups Due
        supabase
            .from('clients')
            .select('*')
            .or(`next_followup_at.lte.${nowIso},last_contacted_at.is.null`)
            .neq('status', 'closed')
            .order('next_followup_at', { ascending: true, nullsFirst: true })
            .limit(10)
    ])

    return (
        <div className="space-y-8">
            <DashboardHeader />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <TaskCard
                    title="Overdue Tasks"
                    icon={Clock}
                    tasks={overdueTasks}
                    variant="warning"
                    showDate={true}
                    emptyMessage="No overdue tasks."
                />

                <TaskCard
                    title="Due Today"
                    icon={Calendar}
                    tasks={dueTodayTasks}
                    variant="success"
                    showDate={false}
                    emptyMessage="No tasks for today."
                />

                <FollowUpCard clients={followups} />
            </div>
        </div>
    )
}
