'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, CheckSquare, Settings, Calendar, Bell, Sun } from 'lucide-react'

const iconMap = {
    dashboard: LayoutDashboard,
    users: Users,
    tasks: CheckSquare,
    settings: Settings,
    calendar: Calendar,
    notifications: Bell,
    today: Sun,
}

interface NavItemProps {
    href: string
    icon: keyof typeof iconMap
    children: React.ReactNode
    badge?: number
}

export function NavItem({ href, icon, children, badge }: NavItemProps) {
    const pathname = usePathname()
    const isActive = pathname === href || pathname?.startsWith(href + '/')
    const Icon = iconMap[icon]

    return (
        <Link
            href={href}
            className={`sidebar-nav-item ${isActive ? 'active' : ''} flex items-center justify-between group`}
        >
            <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span>{children}</span>
            </div>
            {badge !== undefined && badge > 0 && (
                <span className="bg-[#00E676] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {badge}
                </span>
            )}
        </Link>
    )
}
