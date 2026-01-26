import { SidebarLogo } from './sidebar-logo'
import { SidebarNav } from './sidebar-nav'
import { NavItem } from '@/components/ui/nav-item'

interface SidebarProps {
    signOutAction: () => Promise<void>
}

export function Sidebar({ signOutAction }: SidebarProps) {
    return (
        <aside className="sidebar">
            <SidebarLogo />
            <SidebarNav />

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
