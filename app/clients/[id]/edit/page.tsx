import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

export default async function EditClientPage({ params }: { params: { id: string } }) {
    const finalParams = await params
    const supabase = await createClient()

    const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', finalParams.id)
        .single()

    if (!client) notFound()

    async function updateClient(formData: FormData) {
        'use server'
        const supabase = await createClient()

        const name = formData.get('name') as string
        const company = formData.get('company') as string
        const email = formData.get('email') as string
        const phone = formData.get('phone') as string
        const notes = formData.get('notes') as string
        const status = formData.get('status') as string

        const updateData: Record<string, any> = {
            name,
            company: company || null,
            email: email || null,
            phone: phone || null,
            notes: notes || null,
            status: status || 'lead',
        }

        await supabase.from('clients').update(updateData).eq('id', finalParams.id)

        revalidatePath('/clients')
        revalidatePath(`/clients/${finalParams.id}`)
        redirect(`/clients/${finalParams.id}`)
    }

    async function deleteClient() {
        'use server'
        const supabase = await createClient()
        await supabase.from('clients').delete().eq('id', finalParams.id)
        revalidatePath('/clients')
        redirect('/clients')
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Edit Client</h1>
                <div className="flex gap-2">
                    <form action={deleteClient}>
                        <Button variant="destructive" type="submit">Delete</Button>
                    </form>
                    <Link href={`/clients/${finalParams.id}`}>
                        <Button variant="ghost">Cancel</Button>
                    </Link>
                </div>
            </div>

            <form action={updateClient} className="bg-[#151515] p-6 rounded-lg border border-white/10 shadow space-y-4">
                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">Name *</label>
                    <Input id="name" name="name" required defaultValue={client.name} />
                </div>

                <div className="space-y-2">
                    <label htmlFor="company" className="text-sm font-medium">Company</label>
                    <Input id="company" name="company" defaultValue={client.company || ''} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">Email</label>
                        <Input id="email" name="email" type="email" defaultValue={client.email || ''} />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium">Phone</label>
                        <Input id="phone" name="phone" type="tel" defaultValue={client.phone || ''} />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="status" className="text-sm font-medium">Status</label>
                    <select
                        id="status"
                        name="status"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E676] focus-visible:ring-offset-2"
                        defaultValue={client.status}
                    >
                        <option value="lead">Lead</option>
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label htmlFor="notes" className="text-sm font-medium">Notes</label>
                    <textarea
                        id="notes"
                        name="notes"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E676] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue={client.notes || ''}
                    />
                </div>

                <div className="pt-4">
                    <Button type="submit" className="w-full">Update Client</Button>
                </div>
            </form>
        </div>
    )
}
