import { createClient } from '../supabase/server';
import { ZohoTokenResponse } from './common';
import { SupabaseClient } from '@supabase/supabase-js';

export async function getZohoAccessToken(userId: string, supabaseClient?: SupabaseClient, forceRefresh: boolean = false): Promise<string> {
    const supabase = supabaseClient || await createClient();

    // 1. Get stored integration
    const { data: integration, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'zoho')
        .single();

    if (error || !integration) {
        throw new Error('User has not connected Zoho Workspace.');
    }

    // 2. Check if access token is valid (add 5 min buffer)
    if (!forceRefresh && integration.access_token && new Date(integration.expires_at) > new Date(Date.now() + 5 * 60000)) {
        return integration.access_token;
    }

    // 3. Refresh Token
    const location = integration.dc_location || 'us';
    const tld = location === 'us' ? 'com' : location;

    const clientId = process.env.NEXT_PUBLIC_ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('Missing Zoho credentials in environment variables (NEXT_PUBLIC_ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET)');
    }

    const params = new URLSearchParams({
        refresh_token: integration.refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
    });

    try {
        const response = await fetch(`https://accounts.zoho.${tld}/oauth/v2/token`, {
            method: 'POST',
            body: params,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to refresh Zoho token: ${response.statusText} - ${errorText}`);
        }

        const data: ZohoTokenResponse = await response.json();

        if (data.error) {
            throw new Error(`Zoho API Error: ${data.error}`);
        }

        // 4. Save new access token
        await supabase.from('user_integrations').update({
            access_token: data.access_token,
            expires_at: new Date(Date.now() + (data.expires_in * 1000)).toISOString()
        }).eq('id', integration.id);

        return data.access_token;
    } catch (error) {
        console.error('Error getting Zoho access token:', error);
        throw error;
    }
}
