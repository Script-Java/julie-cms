import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface Task {
    id: string
    title: string
    due_at: string
}

interface TaskCardProps {
    title: string
    icon: LucideIcon
    tasks: Task[] | null
    variant?: 'warning' | 'success'
    showDate?: boolean
    emptyMessage?: string
}

const variantStyles = {
    warning: {
        card: 'border-[#D4AF37]/40 bg-[#3a3420]',
        icon: 'text-[#D4AF37]',
        border: 'border-[#D4AF37]/30',
        date: 'text-[#D4AF37]',
        hover: 'hover:border-[#D4AF37]/60 hover:bg-[#3a3420]/80',
    },
    success: {
        card: 'border-[#00E676]/40 bg-[#1a3a2e]',
        icon: 'text-[#00E676]',
        border: 'border-[#00E676]/30',
        date: 'text-[#00E676]',
        hover: 'hover:border-[#00E676]/60 hover:bg-[#1a3a2e]/80',
    },
}

export function TaskCard({
    title,
    icon: Icon,
    tasks,
    variant = 'success',
    showDate = false,
    emptyMessage = 'No tasks.'
}: TaskCardProps) {
    const styles = variantStyles[variant]

    return (
        <Card className={`${styles.card} shadow-sm`}>
            <CardHeader className="pb-3">
                <CardTitle className={`text-sm font-semibold text-white flex items-center`}>
                    <Icon className={`w-4 h-4 mr-2 ${styles.icon}`} />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!tasks || tasks.length === 0 ? (
                    <p className="text-sm text-gray-400">{emptyMessage}</p>
                ) : (
                    <ul className="space-y-2">
                        {tasks.map(task => (
                            <li key={task.id}>
                                <Link
                                    href={`/tasks/${task.id}`}
                                    className={`text-sm flex justify-between items-center bg-[#151515] p-3 rounded-md border ${styles.border} ${styles.hover} shadow-sm transition-all cursor-pointer`}
                                >
                                    <span className="truncate flex-1 font-medium text-white">
                                        {task.title}
                                    </span>
                                    {showDate && (
                                        <span className={`text-xs ${styles.date} font-semibold ml-2`}>
                                            {new Date(task.due_at).toLocaleDateString()}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    )
}
