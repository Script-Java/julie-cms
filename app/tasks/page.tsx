import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, CheckCircle, Circle, Calendar } from 'lucide-react'
import { redirect } from 'next/navigation'

import { TaskList } from '@/components/task-list'

export default async function TasksPage() {
    const supabase = await createClient()

    // ... (keep logs if needed, or remove for clean code) ...

    const { data: tasks } = await supabase
        .from('tasks')
        .select('*, clients(name)')
        .eq('status', 'open')
        .order('due_at', { ascending: true })

    async function completeTask(formData: FormData) {
        'use server'
        const id = formData.get('id') as string
        const supabase = await createClient()

        await supabase.from('tasks').update({
            status: 'done',
            completed_at: new Date().toISOString()
        }).eq('id', id)

        redirect('/tasks')
    }

    async function deleteTasks(ids: string[]) {
        'use server'
        const supabase = await createClient()
        await supabase.from('tasks').delete().in('id', ids)
        redirect('/tasks')
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-white">Tasks</h1>
                <Link href="/tasks/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Task
                    </Button>
                </Link>
            </div>

            <TaskList tasks={tasks || []} completeTaskAction={completeTask} deleteTasksAction={deleteTasks} />
        </div>
    )
}
