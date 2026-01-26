import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { listZohoEmails } from '@/utils/zoho/mail';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const clientEmail = searchParams.get('email');

    if (!clientEmail) {
        return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const emails = await listZohoEmails(user.id, clientEmail);
        return NextResponse.json({ emails });
    } catch (error: any) {
        console.error('Error fetching emails:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { sendZohoEmail } from '@/utils/zoho/mail';

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { to, subject, message } = body;

        if (!to || !subject || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await sendZohoEmail({
            userId: user.id,
            to,
            subject,
            text: message,
            // html: message // Using text for now for simplicity, or we can convert newlines to <br>
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error sending email:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
