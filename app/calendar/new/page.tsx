import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/submit-button'
import { Input } from '@/components/ui/input'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { createZohoCalendarEvent } from '@/utils/zoho/calendar'
import { getZohoAccessToken } from '@/utils/zoho/auth'

export default async function NewEventPage() {

    async function createEvent(formData: FormData) {
        'use server'
        const supabase = await createClient()

        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            throw new Error('You must be logged in to create an event')
        }

        const title = formData.get('title') as string
        const start = formData.get('start') as string
        const end = formData.get('end') as string
        const description = formData.get('description') as string
        const location = formData.get('location') as string

        if (!title || !start || !end) {
            throw new Error('Title, Start Date, and End Date are required.')
        }

        try {
            await getZohoAccessToken(user.id);

            const zohoEvent = {
                title,
                start: new Date(start),
                end: new Date(end),
                description,
                location
            };

            await createZohoCalendarEvent(user.id, zohoEvent);

        } catch (error: any) {
            console.error('Zoho Event Creation Error:', error);
            // If it's a connection error, guide them.
            if (error.message.includes('Missing Zoho credentials') || error.message.includes('not connected')) {
                throw new Error("Zoho Workspace is not connected. Please connect in Settings > Integrations.");
            }
            throw new Error(`Failed to create event: ${error.message}`);
        }

        revalidatePath('/calendar')
        redirect('/calendar')
    }

    // Default dates for better UX
    const now = new Date();
    const nowStr = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">New Calendar Event</h1>
                <Link href="/calendar">
                    <Button variant="ghost">Cancel</Button>
                </Link>
            </div>

            <form action={createEvent} className="bg-[#151515] p-6 rounded-lg border border-white/10 shadow space-y-4">
                <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">Event Title *</label>
                    <Input id="title" name="title" required placeholder="Meeting with..." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="start" className="text-sm font-medium">Start Time *</label>
                        <Input
                            id="start"
                            name="start"
                            type="datetime-local"
                            required
                            defaultValue={nowStr}
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="end" className="text-sm font-medium">End Time *</label>
                        <Input
                            id="end"
                            name="end"
                            type="datetime-local"
                            required
                            defaultValue={oneHourLater}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="location" className="text-sm font-medium">Location</label>
                    <Input id="location" name="location" placeholder="Office, Zoom, etc." />
                </div>

                <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E676] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>

                <div className="pt-4">
                    <SubmitButton className="w-full" pendingText="Creating Event...">Create Event</SubmitButton>
                </div>
            </form>
        </div>
    )
}
