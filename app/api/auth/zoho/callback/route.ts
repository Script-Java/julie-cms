import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const location = searchParams.get('location') || 'us'; // Default to US if missing
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL(`/settings/integrations?error=${error}`, request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/settings/integrations?error=no_code', request.url));
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Zoho logic to determine domain
    // "location" param usually is "us", "eu", "in", "au", "jp"
    const tld = location === 'us' ? 'com' : location;
    const accountsUrl = `https://accounts.zoho.${tld}`;

    try {
        const tokenResponse = await fetch(`${accountsUrl}/oauth/v2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.NEXT_PUBLIC_ZOHO_CLIENT_ID!,
                client_secret: process.env.ZOHO_CLIENT_SECRET!,
                grant_type: 'authorization_code',
                redirect_uri: process.env.NEXT_PUBLIC_ZOHO_REDIRECT_URI!,
            }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error('Zoho Token Error:', tokenData);
            return NextResponse.redirect(new URL(`/settings/integrations?error=${tokenData.error}`, request.url));
        }

        // Upsert into Supabase
        const { error: dbError } = await supabase.from('user_integrations').upsert({
            user_id: user.id,
            provider: 'zoho',
            refresh_token: tokenData.refresh_token,
            access_token: tokenData.access_token,
            expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
            dc_location: location,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id, provider' });

        if (dbError) {
            console.error('Database Error:', dbError);
            return NextResponse.redirect(new URL('/settings/integrations?error=db_save_failed', request.url));
        }

        return NextResponse.redirect(new URL('/settings/integrations?status=success', request.url));

    } catch (err) {
        console.error('Callback Error:', err);
        return NextResponse.redirect(new URL('/settings/integrations?error=server_error', request.url));
    }
}
