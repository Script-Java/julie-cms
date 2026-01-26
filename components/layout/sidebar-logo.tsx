import { Logo } from '@/components/logo'

export function SidebarLogo() {
    return (
        <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
                <Logo size={40} />
                <span className="font-bold text-xl text-white">Julie CMS</span>
            </div>
        </div>
    )
}
