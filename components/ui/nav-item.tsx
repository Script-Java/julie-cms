'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, CheckSquare, Settings, Calendar } from 'lucide-react'

const iconMap = {
    dashboard: LayoutDashboard,
    users: Users,
    tasks: CheckSquare,
    settings: Settings,
    calendar: Calendar,
}

interface NavItemProps {
    href: string
    icon: keyof typeof iconMap
    children: React.ReactNode
}

export function NavItem({ href, icon, children }: NavItemProps) {
    const pathname = usePathname()
    const isActive = pathname === href || pathname?.startsWith(href + '/')
    const Icon = iconMap[icon]

    return (
        <Link
            href={href}
            className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
        >
            <Icon />
            {children}
        </Link>
    )
}
