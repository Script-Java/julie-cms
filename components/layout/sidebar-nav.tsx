import { NavItem } from '@/components/ui/nav-item'

interface SidebarNavProps {
    notificationCount?: number
    tasksDueTodayCount?: number
}

export function SidebarNav({ notificationCount = 0, tasksDueTodayCount = 0 }: SidebarNavProps) {
    return (
        <nav className="flex-1 py-6 space-y-1">
            <NavItem href="/dashboard" icon="dashboard">
                Dashboard
            </NavItem>
            <NavItem href="/today" icon="today" badge={tasksDueTodayCount}>
                Today
            </NavItem>
            <NavItem href="/notifications" icon="notifications" badge={notificationCount}>
                Notifications
            </NavItem>
            <NavItem href="/clients" icon="users">
                Contacts
            </NavItem>
            <NavItem href="/tasks" icon="tasks">
                Tasks
            </NavItem>
            <NavItem href="/calendar" icon="calendar">
                Calendar
            </NavItem>
        </nav>
    )
}
