import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { listZohoCalendarEvents, createZohoCalendarEvent } from '@/utils/zoho/calendar';

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // We could accept query params for date ranges in the future
        const events = await listZohoCalendarEvents(user.id);
        return NextResponse.json(events);
    } catch (error: any) {
        console.error('Error fetching calendar events:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        // Validation could be added here
        const newEvent = await createZohoCalendarEvent(user.id, {
            title: body.title,
            start: new Date(body.start),
            end: new Date(body.end),
            description: body.description,
            location: body.location,
            attendees: body.attendees
        });

        return NextResponse.json(newEvent);
    } catch (error: any) {
        console.error('Error creating calendar event:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
