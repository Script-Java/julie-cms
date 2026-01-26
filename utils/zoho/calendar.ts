import { getZohoAccessToken } from './auth';
import { ZohoEvent } from './common';
import { createClient } from '../supabase/server';

// Helper to get base URL based on saved location
async function getApiUrl(userId: string) {
    const supabase = await createClient();
    const { data } = await supabase.from('user_integrations').select('dc_location').eq('user_id', userId).single();
    const location = data?.dc_location || 'us';
    const tld = location === 'us' ? 'com' : location;
    return `https://calendar.zoho.${tld}/api/v1`;
}


async function getPrimaryCalendarUid(accessToken: string, apiUrl: string, userId: string): Promise<string> {
    const fetchCalendars = async (token: string) => {
        console.log("Fetching Zoho calendars from:", `${apiUrl}/calendars`);
        return await fetch(`${apiUrl}/calendars`, {
            headers: {
                Authorization: `Zoho-oauthtoken ${token}`,
            },
        });
    };

    let response = await fetchCalendars(accessToken);

    if (response.status === 401) {
        console.log("Zoho Calendar 401: Refreshing token and retrying...");
        // Force refresh
        const newToken = await getZohoAccessToken(userId, undefined, true);

        // Retry with new token
        response = await fetchCalendars(newToken);
    }

    // Actually, I should do the "retry" logic properly.
    // Let's update `auth.ts` to support force refresh.
    // Wait, I can't do parallel edits on different files easily in one thought stream if I want to be safe.
    // Let's do the easy part first: proper headers and logging.

    // Re-reading user request: "In utils/zoho/calendar.ts around line 22, replace the throw with this..."
    // "Also log the URL..."
    // "2) Make sure you’re using the correct Zoho auth header"

    if (!response.ok) {
        // Try to refresh if 401 - simplistic approach: 
        // If we really want to fix 401s that happen despite valid expiry time, we need `forceRefresh`.
        // I will implement the headers and logging first. 
        // Then I will go update auth.ts and then come back here? 
        // Or I can do the retry logic here if I import the refresh logic? No, too much code dupe.

        const text = await response.text();
        console.error(`Zoho Calendar Error: ${response.status} ${response.statusText}`, text);

        throw new Error(
            `Failed to fetch calendars: ${response.status} ${response.statusText} :: ${text}`
        );
    }

    const data = await response.json();
    const calendars = data.calendars || [];

    const defaultCal = calendars.find((c: any) => c.isdefault) || calendars[0];

    if (!defaultCal) {
        throw new Error('No calendars found in Zoho account');
    }

    return defaultCal.uid;
}

export async function createZohoCalendarEvent(userId: string, event: ZohoEvent) {
    const token = await getZohoAccessToken(userId);
    const apiUrl = await getApiUrl(userId);

    // We pass userId to getPrimaryCalendarUid now for refresh logic
    const calendarUid = await getPrimaryCalendarUid(token, apiUrl, userId);

    // Format: yyyyMMddTHHmmssZ
    const formatTime = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const payload = {
        eventdata: {
            title: event.title,
            dateandtime: {
                start: formatTime(event.start),
                end: formatTime(event.end),
                timezone: "UTC"
            },
            description: event.description || '',
            location: event.location || '',
            attendees: event.attendees ? event.attendees.map(email => ({ email })) : []
        }
    };

    const response = await fetch(`${apiUrl}/calendars/${calendarUid}/events`, {
        method: 'POST',
        headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Failed to create event: ${err}`);
    }

    return await response.json();
}

export async function listZohoCalendarEvents(userId: string) {
    const token = await getZohoAccessToken(userId);
    const apiUrl = await getApiUrl(userId);
    const calendarUid = await getPrimaryCalendarUid(token, apiUrl, userId);

    const response = await fetch(`${apiUrl}/calendars/${calendarUid}/events`, {
        headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
        },
    });

    if (!response.ok) {
        const err = await response.text();
        console.error('Zoho Calendar List Error:', err);
        throw new Error(`Failed to list events: ${err}`);
    }

    const data = await response.json();
    return data.data || [];
}

export async function updateZohoCalendarEvent(userId: string, eventUid: string, event: ZohoEvent) {
    const token = await getZohoAccessToken(userId);
    const apiUrl = await getApiUrl(userId);
    const calendarUid = await getPrimaryCalendarUid(token, apiUrl, userId);

    const formatTime = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const payload = {
        eventdata: {
            title: event.title,
            dateandtime: {
                start: formatTime(event.start),
                end: formatTime(event.end),
                timezone: "UTC"
            },
            description: event.description || '',
            location: event.location || '',
            attendees: event.attendees ? event.attendees.map(email => ({ email })) : []
        }
    };

    const response = await fetch(`${apiUrl}/calendars/${calendarUid}/events/${eventUid}`, {
        method: 'PUT',
        headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Failed to update event: ${err}`);
    }

    return await response.json();
}

export async function deleteZohoCalendarEvent(userId: string, eventUid: string) {
    const token = await getZohoAccessToken(userId);
    const apiUrl = await getApiUrl(userId);
    const calendarUid = await getPrimaryCalendarUid(token, apiUrl, userId);

    const response = await fetch(`${apiUrl}/calendars/${calendarUid}/events/${eventUid}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
        },
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Failed to delete event: ${err}`);
    }

    return true;
}
