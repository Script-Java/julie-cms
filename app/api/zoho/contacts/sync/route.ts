import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { fetchSentMessages } from '@/utils/zoho/mail';

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const sentMessages = await fetchSentMessages(user.id, 100); // Fetch last 100 sent emails

        // Extract potential clients
        const uniqueContacts = new Map<string, { email: string, name: string }>();

        sentMessages.forEach((msg: any) => {
            // Zoho message structure regarding 'to' field:
            // msg.toAddress usually contains the email, sometimes comma separated if multiple
            // But checking the API response structure is crucial. 
            // Often it provides 'to' as generic string or array.
            // Let's assume msg.toAddress exists, or iterate over msg.to if it's an array of objects.

            // NOTE: Standard Zoho API response for list messages usually has `toAddress` as a string.
            // It might contain "Name <email@example.com>" or just "email@example.com".

            if (msg.toAddress) {
                // Split by comma, but be careful of commas inside quotes if any (simple split first)
                const recipients = msg.toAddress.split(',');

                recipients.forEach((recipient: string) => {
                    let clean = recipient.trim();

                    // 1. Decode HTML entities
                    clean = clean
                        .replace(/&quot;/g, '"')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&amp;/g, '&');

                    // 2. Remove quotes around the whole string if they exist (sometimes happens)
                    clean = clean.replace(/^"(.*)"$/, '$1');

                    // 3. Extract Name v. Email
                    // Patterns: 
                    // "Name" <email@domain.com>
                    // Name <email@domain.com>
                    // email@domain.com
                    // "name"<email> (no space)

                    let email = '';
                    let name = '';

                    const match = clean.match(/^(.*?)\s*<([^>]+)>$/);

                    if (match) {
                        name = match[1].trim().replace(/^"|"$/g, '').trim(); // Remove surrounding quotes from name
                        email = match[2].trim();
                    } else {
                        // No brackets? Assume it's just an email
                        email = clean.replace(/^"|"$/g, '').trim();
                        if (email.includes('@')) {
                            name = email.split('@')[0];
                        }
                    }

                    // Validate Email
                    if (email && email.includes('@') && !email.includes(' ')) {
                        // Filter out malformed emails that might still look like "sticky@stickyslap.com>"
                        email = email.replace(/>$/, '');

                        // Clean Name if it looks like the email user part
                        if (!name || name === email) {
                            name = email.split('@')[0];
                            // Capitalize first letter
                            name = name.charAt(0).toUpperCase() + name.slice(1);
                        }

                        if (!uniqueContacts.has(email)) {
                            uniqueContacts.set(email, { email, name });
                        }
                    }
                });
            }
        });

        const potentials = Array.from(uniqueContacts.values());

        // Optional: Filter out contacts that already exist in Supabase 'clients' table
        // to avoid showing duplicates to the user.
        const { data: existingClients } = await supabase
            .from('clients')
            .select('email')
            .in('email', potentials.map(p => p.email));

        const existingEmails = new Set(existingClients?.map(c => c.email) || []);

        const newContacts = potentials.filter(p => !existingEmails.has(p.email));

        return NextResponse.json({ contacts: newContacts });

    } catch (error: any) {
        console.error('Error syncing Zoho contacts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
