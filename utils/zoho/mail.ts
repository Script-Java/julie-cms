import { getZohoAccessToken } from './auth';
import { createClient } from '../supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

// Helper to get location specifics
async function getZohoLocation(userId: string, supabaseClient?: SupabaseClient) {
    const supabase = supabaseClient || await createClient();
    const { data } = await supabase.from('user_integrations').select('dc_location').eq('user_id', userId).single();
    const location = data?.dc_location || 'us';
    const tld = location === 'us' ? 'com' : location;

    return {
        tld,
        smtpHost: `smtp.zoho.${tld}`,
        apiUrl: `https://mail.zoho.${tld}/api`
    };
}

export async function sendZohoEmail({
    userId,
    to,
    subject,
    html,
    text,
}: {
    userId: string;
    to: string;
    subject: string;
    html?: string;
    text?: string;
}) {
    // Get Access Token (handles refresh automatically)
    const accessToken = await getZohoAccessToken(userId);
    const { apiUrl } = await getZohoLocation(userId);

    // 1. Get Account ID
    const accountRes = await fetch(`${apiUrl}/accounts`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!accountRes.ok) throw new Error(`Failed to fetch Zoho Mail account info: ${await accountRes.text()}`);
    const accountData = await accountRes.json();
    // console.log('[Zoho Mail] Account Data:', JSON.stringify(accountData, null, 2));

    const accountId = accountData.data?.[0]?.accountId;
    // Try to find the best from address
    const account = accountData.data?.[0];
    const fromAddress = account?.primaryEmailAddress || account?.incomingUserName;

    console.log('[Zoho Mail] Selected From Address:', fromAddress);

    if (!accountId) throw new Error('No Zoho Mail account found');
    if (!fromAddress) throw new Error('No Zoho Mail from address found');

    // 2. Create draft first
    const payload = {
        fromAddress: fromAddress,
        toAddress: to,
        subject: subject,
        content: html || text || '',
        askReceipt: "yes"
    };

    // Create the draft
    const draftResponse = await fetch(`${apiUrl}/accounts/${accountId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!draftResponse.ok) {
        const err = await draftResponse.text();
        throw new Error(`Failed to create draft: ${err}`);
    }

    const draftData = await draftResponse.json();
    const messageId = draftData.data?.messageId;

    if (!messageId) {
        throw new Error('Failed to get message ID from draft');
    }

    // 3. Send the draft using the correct endpoint
    const sendResponse = await fetch(`${apiUrl}/accounts/${accountId}/messages/${messageId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mode: 'send' })
    });

    if (!sendResponse.ok) {
        const err = await sendResponse.text();
        throw new Error(`Failed to send email: ${err}`);
    }

    return await sendResponse.json();
}

export async function listZohoEmails(userId: string, clientEmail: string) {
    const accessToken = await getZohoAccessToken(userId);
    const { apiUrl } = await getZohoLocation(userId);

    // 1. Get Account ID
    const accountRes = await fetch(`${apiUrl}/accounts`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!accountRes.ok) {
        const err = await accountRes.text();
        throw new Error(`Failed to fetch Zoho Mail account info: ${err}`);
    }

    const accountData = await accountRes.json();
    const accountId = accountData.data?.[0]?.accountId;

    if (!accountId) {
        throw new Error('No Zoho Mail account found');
    }

    // 2. Search Messages
    const searchParams = new URLSearchParams({
        searchKey: `entire:${clientEmail}`,
        limit: '20'
    });

    const searchUrl = `${apiUrl}/accounts/${accountId}/messages/search?${searchParams.toString()}`;
    console.log(`[Zoho] Searching emails with URL: ${searchUrl}`);

    const response = await fetch(searchUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
        const err = await response.text();
        console.error(`[Zoho] Search failed: ${err}`);
        throw new Error(`Failed to fetch emails: ${err}`);
    }

    const data = await response.json();
    console.log(`[Zoho] Search response preview:`, JSON.stringify(data.data?.[0] || {}, null, 2));
    return data.data || [];
}

export async function createZohoDraft(userId: string, to: string, subject: string, content: string, supabaseClient?: SupabaseClient) {
    const accessToken = await getZohoAccessToken(userId, supabaseClient);
    const { apiUrl } = await getZohoLocation(userId, supabaseClient);

    // 1. Get Account ID
    const accountRes = await fetch(`${apiUrl}/accounts`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!accountRes.ok) throw new Error(`Failed to fetch Zoho Mail account info: ${await accountRes.text()}`);
    const accountData = await accountRes.json();
    const accountId = accountData.data?.[0]?.accountId;
    const account = accountData.data?.[0];
    const fromAddress = account?.primaryEmailAddress || account?.incomingUserName;

    if (!accountId) throw new Error('No Zoho Mail account found');

    // 2. Create Draft using Zoho API
    const payload = {
        fromAddress: fromAddress,
        toAddress: to,
        subject: subject,
        content: content,
        askReceipt: "yes"
    };

    const response = await fetch(`${apiUrl}/accounts/${accountId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Failed to create draft: ${err}`);
    }

    return await response.json();
}

export async function getSentFolderId(userId: string) {
    const accessToken = await getZohoAccessToken(userId);
    const { apiUrl } = await getZohoLocation(userId);

    // 1. Get Account ID
    const accountRes = await fetch(`${apiUrl}/accounts`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!accountRes.ok) throw new Error(`Failed to fetch Zoho Mail account info: ${await accountRes.text()}`);
    const accountData = await accountRes.json();
    const accountId = accountData.data?.[0]?.accountId;
    if (!accountId) throw new Error('No Zoho Mail account found');

    // 2. Get Folders
    const foldersRes = await fetch(`${apiUrl}/accounts/${accountId}/folders`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!foldersRes.ok) throw new Error(`Failed to fetch folders: ${await foldersRes.text()}`);
    const foldersData = await foldersRes.json();

    // Find folder with name 'Sent' or path containing 'Sent'
    // Zoho usually returns a standard list. The sent folder path might be different but usually "Sent" is the name.
    const sentFolder = foldersData.data?.find((f: any) => f.name === 'Sent' || f.path.endsWith('Sent'));

    if (!sentFolder) {
        throw new Error('Could not find Sent folder in Zoho Mail');
    }

    return { accountId, folderId: sentFolder.folderId };
}

export async function fetchSentMessages(userId: string, limit: number = 50) {
    const accessToken = await getZohoAccessToken(userId);
    const { apiUrl } = await getZohoLocation(userId);
    const { accountId, folderId } = await getSentFolderId(userId);

    const params = new URLSearchParams({
        folderId: folderId,
        limit: limit.toString(),
    });

    const url = `${apiUrl}/accounts/${accountId}/messages/view?${params.toString()}`;
    console.log('Fetching Zoho messages from:', url);

    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch sent messages: ${await response.text()}`);
    }

    const data = await response.json();
    return data.data || [];
}
