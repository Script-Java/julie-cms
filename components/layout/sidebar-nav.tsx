import { NavItem } from '@/components/ui/nav-item'

export function SidebarNav() {
    return (
        <nav className="flex-1 py-6">
            <NavItem href="/dashboard" icon="dashboard">
                Dashboard
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
