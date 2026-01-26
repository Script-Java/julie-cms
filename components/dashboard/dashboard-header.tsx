import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { Plus } from 'lucide-react'

export function DashboardHeader() {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Logo size={48} />
                <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
            </div>
            <div className="flex gap-3">
                <Link href="/clients/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" /> New Client
                    </Button>
                </Link>
                <Link href="/tasks/new">
                    <Button variant="outline">
                        <Plus className="w-4 h-4 mr-2" /> New Task
                    </Button>
                </Link>
            </div>
        </div>
    )
}
