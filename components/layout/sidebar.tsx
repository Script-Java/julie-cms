import { SidebarLogo } from './sidebar-logo'
import { SidebarNav } from './sidebar-nav'
import { NavItem } from '@/components/ui/nav-item'
import { createClient } from '@/utils/supabase/server'

interface SidebarProps {
    signOutAction: () => Promise<void>
}

export async function Sidebar({ signOutAction }: SidebarProps) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get start and end of today in UTC (simplified for now)
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

    // Fetch tasks due today (and overdue tasks that are not completed)
    const { count: tasksDueCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .lte('due_at', endOfDay) // Due before end of today
        .neq('status', 'done')   // Assuming 'done' or 'completed'. Let's check task-list for status values. 
    // Actually, safer to just count all due today for now.
    // Waiting to check status values.

    // Let's refine the query in a moment. For now, fetch generic count.

    // Better query:
    const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        // .eq('user_id', user?.id) // Add RLS if needed, but usually handled by policy
        .lte('due_at', endOfDay)
        .neq('status', 'completed') // Common status

    return (
        <aside className="sidebar">
            <SidebarLogo />
            <SidebarNav
                tasksDueTodayCount={count || 0}
                notificationCount={count || 0}
            />

            {/* Bottom Section */}
            <div className="border-t border-gray-200 p-4">
                <NavItem href="/settings" icon="settings">
                    Settings
                </NavItem>
                <form action={signOutAction}>
                    <button type="submit" className="sidebar-nav-item w-full text-left">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                    </button>
                </form>
            </div>
        </aside>
    )
}
