import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/submit-button'
import { Input } from '@/components/ui/input'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

export default function NewClientPage() {
    async function createClientAction(formData: FormData) {
        'use server'
        const supabase = await createClient()

        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            console.error('Authentication error:', authError)
            throw new Error('You must be logged in to create a client')
        }

        const name = formData.get('name') as string
        const company = formData.get('company') as string
        const email = formData.get('email') as string
        const phone = formData.get('phone') as string
        const notes = formData.get('notes') as string

        // Build insert data dynamically
        const insertData: Record<string, any> = {
            name,
            status: 'lead',
            followup_frequency_days: 14,
        }

        // Add user_id to ensure RLS policies work correctly
        if (user) {
            insertData.user_id = user.id
        }

        // Only add optional fields if they have values
        if (company) insertData.company = company
        if (email) insertData.email = email
        if (phone) insertData.phone = phone
        if (notes) insertData.notes = notes

        const { data, error } = await supabase
            .from('clients')
            .insert(insertData)
            .select()
            .single()

        if (error) {
            console.error('Error creating client:', error)
            console.error('Error details:', JSON.stringify(error, null, 2))

            // Provide specific guidance based on error
            if (error.message.includes('schema cache') || error.message.includes('column')) {
                throw new Error(`Database schema error: ${error.message}. Please ensure your Supabase database has the correct table structure and RLS policies. See SUPABASE_FIX.md for instructions.`)
            }
            throw new Error(`Failed to create client: ${error.message}`)
        }

        revalidatePath('/clients')
        redirect(`/clients/${data.id}`)
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">New Client</h1>
                <Link href="/clients">
                    <Button variant="ghost">Cancel</Button>
                </Link>
            </div>

            <form action={createClientAction} className="bg-[#151515] p-6 rounded-lg border border-white/10 shadow space-y-4">
                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">Name *</label>
                    <Input id="name" name="name" required placeholder="Jane Doe" />
                </div>

                <div className="space-y-2">
                    <label htmlFor="company" className="text-sm font-medium">Company</label>
                    <Input id="company" name="company" placeholder="Acme Inc." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">Email</label>
                        <Input id="email" name="email" type="email" placeholder="jane@example.com" />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium">Phone</label>
                        <Input id="phone" name="phone" type="tel" placeholder="+1 555-0123" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="notes" className="text-sm font-medium">Initial Notes</label>
                    <textarea
                        id="notes"
                        name="notes"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E676] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Met at conference..."
                    />
                </div>

                <div className="pt-4">
                    <SubmitButton className="w-full" pendingText="Creating Client...">Create Client</SubmitButton>
                </div>
            </form>
        </div>
    )
}
