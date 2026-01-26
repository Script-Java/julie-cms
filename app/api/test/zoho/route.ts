import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendZohoEmail } from '@/utils/zoho/mail';
import { listZohoCalendarEvents } from '@/utils/zoho/calendar';

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: any = {
        email: 'pending',
        calendar: 'pending'
    };

    try {
        // Test Email
        await sendZohoEmail({
            userId: user.id,
            to: user.email!, // Send to logged in user
            subject: 'Zoho Integration Test',
            text: 'If you are reading this, your Zoho Mail integration is working!',
        });
        results.email = 'Success';
    } catch (e: any) {
        console.error("Email Test Failed", e);
        results.email = `Failed: ${e.message}`;
    }

    try {
        // Test Calendar
        const events = await listZohoCalendarEvents(user.id);
        results.calendar = `Success: Found ${events.events?.length || 0} events`;
    } catch (e: any) {
        console.error("Calendar Test Failed", e);
        results.calendar = `Failed: ${e.message}`;
    }

    return NextResponse.json(results);
}
