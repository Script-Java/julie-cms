import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export default async function EditTaskPage({ params }: { params: { id: string } }) {
    const finalParams = await params;
    const supabase = await createClient()

    const { data: task } = await supabase.from('tasks').select('*').eq('id', finalParams.id).single()
    if (!task) notFound()

    const { data: clients } = await supabase.from('clients').select('id, name').order('name')

    async function updateTask(formData: FormData) {
        'use server'
        const supabase = await createClient()

        const title = formData.get('title') as string
        const client_id = formData.get('client_id') as string || null
        const due_at = formData.get('due_at') as string
        const priority = formData.get('priority') as string
        const description = formData.get('description') as string

        await supabase.from('tasks').update({
            title,
            client_id: client_id === 'none' ? null : client_id,
            due_at: due_at ? new Date(due_at).toISOString() : null,
            priority,
            description
        }).eq('id', finalParams.id)

        redirect('/tasks')
    }

    async function deleteTask() {
        'use server'
        const supabase = await createClient()
        await supabase.from('tasks').delete().eq('id', finalParams.id)
        redirect('/tasks')
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Edit Task</h1>
                <div className="flex gap-2">
                    <form action={deleteTask}>
                        <Button variant="destructive" type="submit">Delete</Button>
                    </form>
                    <Link href="/tasks">
                        <Button variant="ghost">Cancel</Button>
                    </Link>
                </div>
            </div>

            <form action={updateTask} className="bg-[#151515] p-6 rounded-lg border border-white/10 shadow space-y-4">
                <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">Task Title *</label>
                    <Input id="title" name="title" required defaultValue={task.title} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="client" className="text-sm font-medium">Client</label>
                        <select
                            id="client"
                            name="client_id"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E676] focus-visible:ring-offset-2"
                            defaultValue={task.client_id || 'none'}
                        >
                            <option value="none">No Client</option>
                            {clients?.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="due_at" className="text-sm font-medium">Due Date</label>
                        <Input
                            id="due_at"
                            name="due_at"
                            type="date"
                            defaultValue={task.due_at ? new Date(task.due_at).toISOString().split('T')[0] : ''}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="priority" className="text-sm font-medium">Priority</label>
                    <select
                        id="priority"
                        name="priority"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E676] focus-visible:ring-offset-2"
                        defaultValue={task.priority}
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E676] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue={task.description || ''}
                    />
                </div>

                <div className="pt-4">
                    <Button type="submit" className="w-full">Update Task</Button>
                </div>
            </form>
        </div>
    )
}
