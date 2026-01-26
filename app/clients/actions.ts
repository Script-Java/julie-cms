'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteClients(ids: string[]) {
    const supabase = await createClient()

    try {
        const { error } = await supabase
            .from('clients')
            .delete()
            .in('id', ids)

        if (error) {
            throw new Error(error.message)
        }

        revalidatePath('/clients')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}
