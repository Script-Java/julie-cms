import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { clients } = body;

        if (!Array.isArray(clients) || clients.length === 0) {
            return NextResponse.json({ error: 'No clients provided' }, { status: 400 });
        }

        // Prepare data for insertion
        const clientsToInsert = clients.map((client: any) => ({
            name: client.name || client.email?.split('@')[0] || 'Unknown',
            email: client.email,
            phone: client.phone === 'N/A' ? null : client.phone,
            company: client.company === 'N/A' ? null : client.company,
            status: 'lead',
            followup_frequency_days: 14,
            user_id: user.id
        }));

        const { data, error: insertError } = await supabase
            .from('clients')
            .insert(clientsToInsert)
            .select();

        if (insertError) {
            throw new Error(`Failed to insert clients: ${insertError.message}`);
        }

        return NextResponse.json({ success: true, count: data.length });

    } catch (error: any) {
        console.error('Error batch creating clients:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
