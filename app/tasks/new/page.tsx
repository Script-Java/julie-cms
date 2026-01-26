import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/submit-button'
import { Input } from '@/components/ui/input'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { createZohoCalendarEvent } from '@/utils/zoho/calendar'
import { getZohoAccessToken } from '@/utils/zoho/auth'
import { Checkbox } from '@/components/ui/checkbox'

export default async function NewTaskPage() {
    const supabase = await createClient()
    const { data: clients } = await supabase.from('clients').select('id, name').order('name')

    async function createTask(formData: FormData) {
        'use server'
        const supabase = await createClient()

        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            console.error('Authentication error:', authError)
            throw new Error('You must be logged in to create a task')
        }

        const title = formData.get('title') as string
        const client_id = formData.get('client_id') as string || null
        const due_at = formData.get('due_at') as string
        const priority = formData.get('priority') as string
        const description = formData.get('description') as string

        const syncToZoho = formData.get('sync_to_zoho') === 'on'

        // First, try to insert with all fields
        const insertData: Record<string, any> = {
            title,
            priority,
            status: 'open', // Set status to 'open' so it appears in the tasks list
        }

        // Only add optional fields if they have values
        if (client_id && client_id !== 'none') {
            insertData.client_id = client_id
        }
        if (due_at) {
            insertData.due_at = new Date(due_at).toISOString()
        }
        if (description) {
            insertData.description = description
        }

        // Add user_id to ensure RLS policies work correctly
        if (user) {
            insertData.user_id = user.id
        }

        // Handle Zoho Sync if requested
        if (syncToZoho && user) {
            try {
                // Verify Zoho connection first
                try {
                    await getZohoAccessToken(user.id);
                } catch (e) {
                    // If no token, maybe we shouldn't sync, or throw error?
                    // For now, let's treat it as a warning or throw if user strictly requested it.
                    // But the form submission creates the task first usually?
                    // Let's create the event first to get the ID, then save task.
                    // If Zoho fails, should we fail task creation? Maybe yes, to provide feedback.
                    throw new Error("Zoho integration is not connected. Please connect in Settings.");
                }

                // Create Zoho Event
                // We need start/end times. If due_at is provided, use it.
                // If no due_at, user should probably provide one for calendar sync.
                if (!due_at) {
                    throw new Error("Due date is required for Zoho Calendar sync.");
                }

                const startDate = new Date(due_at);
                // Default duration 1 hour? Or all day? Zoho supports all day maybe?
                // Our utils enforce start and end date objects.
                const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later

                const zohoEvent = {
                    title: title,
                    start: startDate,
                    end: endDate,
                    description: description,
                    // location? attendees?
                };

                const createdEvent = await createZohoCalendarEvent(user.id, zohoEvent);
                if (createdEvent && createdEvent.data && createdEvent.data.uid) {
                    insertData.zoho_event_id = createdEvent.data.uid;
                }

            } catch (error: any) {
                console.error('Zoho Sync Error:', error);
                throw new Error(`Zoho Sync Failed: ${error.message}`);
            }
        }

        const { data, error } = await supabase
            .from('tasks')
            .insert(insertData)
            .select()
            .single()

        if (error) {
            console.error('Error creating task:', error)
            console.error('Error details:', JSON.stringify(error, null, 2))

            // Provide specific guidance based on error
            if (error.message.includes('schema cache') || error.message.includes('column')) {
                throw new Error(`Database schema error: ${error.message}. Please ensure your Supabase database has the correct table structure and RLS policies. See SUPABASE_FIX.md for instructions.`)
            }
            throw new Error(`Failed to create task: ${error.message}`)
        }

        revalidatePath('/tasks')
        redirect('/tasks')
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">New Task</h1>
                <Link href="/tasks">
                    <Button variant="ghost">Cancel</Button>
                </Link>
            </div>

            <form action={createTask} className="bg-[#151515] p-6 rounded-lg border border-white/10 shadow space-y-4">
                <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">Task Title *</label>
                    <Input id="title" name="title" required placeholder="Follow up call..." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="client" className="text-sm font-medium">Client</label>
                        <select
                            id="client"
                            name="client_id"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E676] focus-visible:ring-offset-2"
                        >
                            <option value="none">No Client</option>
                            {clients?.map((c: { id: string; name: string }) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="due_at" className="text-sm font-medium">Due Date</label>
                        <Input id="due_at" name="due_at" type="date" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="priority" className="text-sm font-medium">Priority</label>
                    <select
                        id="priority"
                        name="priority"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E676] focus-visible:ring-offset-2"
                        defaultValue="medium"
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
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox id="sync_to_zoho" name="sync_to_zoho" />
                    <label
                        htmlFor="sync_to_zoho"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Sync to Zoho Calendar
                    </label>
                </div>

                <div className="pt-4">
                    <SubmitButton className="w-full" pendingText="Creating Task...">Create Task</SubmitButton>
                </div>
            </form>
        </div>
    )
}
