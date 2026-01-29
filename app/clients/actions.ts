'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function logContact(formData: FormData) {
    const supabase = await createClient()
    const clientId = formData.get('clientId') as string
    const type = formData.get('type') as string
    const summary = formData.get('summary') as string

    // Determine redirect path - if called from a specific page, we might want to stay there
    // But typically this is used on the client detail page.
    const path = `/clients/${clientId}`

    // 1. Get user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    // 2. Insert touchpoint with user_id
    await supabase.from('touchpoints').insert({
        client_id: clientId,
        type,
        summary,
        user_id: user.id
    })

    // 3. Update client next follow-up
    // We need to fetch the client to know their frequency preferences
    const { data: client } = await supabase
        .from('clients')
        .select('followup_frequency_days')
        .eq('id', clientId)
        .single()

    const nextFollowup = new Date()
    nextFollowup.setDate(nextFollowup.getDate() + (client?.followup_frequency_days || 14))

    await supabase.from('clients').update({
        last_contacted_at: new Date().toISOString(),
        next_followup_at: nextFollowup.toISOString()
    }).eq('id', clientId)

    revalidatePath(path)
}

export async function snooze(formData: FormData) {
    const supabase = await createClient()
    const clientId = formData.get('clientId') as string
    const path = `/clients/${clientId}`

    const { data: client } = await supabase.from('clients').select('next_followup_at').eq('id', clientId).single()

    const current = client?.next_followup_at ? new Date(client.next_followup_at) : new Date()
    // Add 3 days
    current.setDate(current.getDate() + 3)

    await supabase.from('clients').update({
        next_followup_at: current.toISOString()
    }).eq('id', clientId)

    revalidatePath(path)
}

export async function deleteClients(clientIds: string[]) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    try {
        const { error } = await supabase
            .from('clients')
            .delete()
            .in('id', clientIds)
            .eq('user_id', user.id) // Security: Ensure user owns the data

        if (error) {
            console.error('Error deleting clients:', error)
            return { error: error.message }
        }

        revalidatePath('/clients')
        return { error: null }
    } catch (error: any) {
        console.error('Unexpected error deleting clients:', error)
        return { error: error.message || 'An unexpected error occurred' }
    }
}
