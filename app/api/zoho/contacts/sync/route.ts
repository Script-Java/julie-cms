import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { fetchSentMessages, getZohoEmailContent, getZohoAccessToken, getZohoLocation } from '@/utils/zoho/mail';

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const sentMessages = await fetchSentMessages(user.id, 100); // Fetch last 100 sent emails

        // Extract potential clients
        const uniqueContacts = new Map<string, { email: string, name: string, sentMessageId: string, sentFolderId: string }>();

        sentMessages.forEach((msg: any) => {
            if (msg.toAddress) {
                const recipients = msg.toAddress.split(',');

                recipients.forEach((recipient: string) => {
                    let clean = recipient.trim();
                    clean = clean.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
                    clean = clean.replace(/^"(.*)"$/, '$1');

                    let email = '';
                    let name = '';

                    const match = clean.match(/^(.*?)\s*<([^>]+)>$/);
                    if (match) {
                        name = match[1].trim().replace(/^"|"$/g, '').trim();
                        email = match[2].trim();
                    } else {
                        email = clean.replace(/^"|"$/g, '').trim();
                        if (email.includes('@')) name = email.split('@')[0];
                    }

                    if (email && email.includes('@') && !email.includes(' ')) {
                        email = email.replace(/>$/, '');
                        if (!name || name === email) {
                            name = email.split('@')[0];
                            name = name.charAt(0).toUpperCase() + name.slice(1);
                        }

                        if (!uniqueContacts.has(email)) {
                            uniqueContacts.set(email, {
                                email,
                                name,
                                sentMessageId: msg.messageId,
                                sentFolderId: msg.folderId
                            });
                        }
                    }
                });
            }
        });

        const potentials = Array.from(uniqueContacts.values());

        // Filter out existing clients
        const { data: existingClients } = await supabase
            .from('clients')
            .select('email')
            .in('email', potentials.map(p => p.email));

        const existingEmails = new Set(existingClients?.map(c => c.email) || []);
        const newContacts = potentials.filter(p => !existingEmails.has(p.email));

        // Limit enrichment
        const contactsToEnrich = newContacts.slice(0, 20);

        // Pre-fetch Zoho Location & Account ID
        const zohoLocation = await getZohoLocation(user.id);
        const accessToken = await getZohoAccessToken(user.id);

        // Fetch Account ID explicitely
        const accountRes = await fetch(`${zohoLocation.apiUrl}/accounts`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const accountData = await accountRes.json();
        const accountId = accountData.data?.[0]?.accountId;

        const enrichedContacts = await Promise.all(contactsToEnrich.map(async (contact) => {
            let phone = 'N/A';
            let company = 'N/A';

            try {
                let contentToScan = '';

                // 1. Try to find RECEIVED message (Signature is theirs)
                let foundReceived = false;
                if (accountId) {
                    const searchUrl = `${zohoLocation.apiUrl}/accounts/${accountId}/messages/search?searchKey=sender:${contact.email}&limit=1`;
                    const searchRes = await fetch(searchUrl, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    });

                    if (searchRes.ok) {
                        const searchData = await searchRes.json();
                        const receivedMsg = searchData.data?.[0];

                        if (receivedMsg && receivedMsg.messageId && receivedMsg.folderId) {
                            const contentData = await getZohoEmailContent(user.id, receivedMsg.messageId, receivedMsg.folderId);
                            if (contentData.content) {
                                contentToScan = contentData.content;
                                foundReceived = true;
                            }
                        }
                    }
                }

                // 2. Fallback to SENT message (Signature is ours, but history might have theirs)
                if (!foundReceived && contact.sentMessageId && contact.sentFolderId) {
                    const contentData = await getZohoEmailContent(user.id, contact.sentMessageId, contact.sentFolderId);
                    if (contentData.content) {
                        contentToScan = contentData.content;
                    }
                }

                if (contentToScan) {
                    // Simple HTML to Text
                    let text = contentToScan.replace(/<[^>]+>/g, '\n').replace(/\s+/g, ' ');

                    // If it was a RECEIVED regular email, stripping quotes is good to avoid finding MY signature in the history
                    // If it was a SENT email, stripping quotes strips THEIR history, so we might want to keep it?
                    // BUT, rely on the specific number block to keep us safe.
                    // Let's only strip if we found a Received email (standard signature location)
                    if (foundReceived) {
                        const separators = [
                            '-----Original Message-----', '----- Original Message -----',
                            '________________________________', 'From: ', 'Sent from my iPhone', 'Sent from my Android', 'On '
                        ];
                        const replyRegex = /On\s+.+?wrote:/i;
                        const replyMatch = text.match(replyRegex);
                        if (replyMatch && replyMatch.index) text = text.substring(0, replyMatch.index);
                        for (const sep of separators) {
                            const idx = text.indexOf(sep);
                            if (idx !== -1) text = text.substring(0, idx);
                        }
                    }

                    if (text.length > 5000) text = text.substring(0, 5000); // Increased limit slightly

                    // 1. Phone Extraction
                    const phoneRegex = /(?:\b\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
                    const matches = text.match(phoneRegex);

                    if (matches) {
                        // Heuristic: Labeled first, then last match
                        const labeledPhoneRegex = /(?:Phone|Tel|Mobile|Cell|Direct|T|M|C|P)\s*:?\s*((?:\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/i;
                        const labeledMatch = text.match(labeledPhoneRegex);

                        let candidates = [];
                        if (labeledMatch) candidates.push(labeledMatch[1]);
                        if (matches.length > 0) candidates.push(matches[matches.length - 1]);
                        // Add all matches as candidates just in case
                        candidates = [...candidates, ...matches.reverse()];

                        // Find first valid candidate that isn't the user's number
                        for (const candidateRaw of candidates) {
                            const digits = candidateRaw.replace(/\D/g, '');
                            // BLOCK USER'S OWN NUMBER: 4699013579
                            if (!digits.includes('4699013579')) {
                                phone = candidateRaw.trim();
                                break; // Found one!
                            }
                        }
                    }

                    // 2. Company Extraction
                    const companyRegex = /Company\s*:?\s*([A-Za-z0-9\s.,&]+)/i;
                    const companyMatch = text.match(companyRegex);
                    if (companyMatch) {
                        company = companyMatch[1].trim();
                    } else {
                        const domain = contact.email.split('@')[1];
                        const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'zoho.com'];
                        if (domain && !genericDomains.includes(domain)) {
                            const domainName = domain.split('.')[0];
                            company = domainName.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                        }
                    }

                    if (company.length > 50) company = 'N/A';
                }

            } catch (err) {
                console.warn(`Failed to enrich contact ${contact.email}:`, err);
            }

            return {
                ...contact,
                phone,
                company
            };
        }));

        const skipped = newContacts.slice(20).map(c => ({ ...c, phone: 'N/A', company: 'N/A' }));

        return NextResponse.json({ contacts: [...enrichedContacts, ...skipped] });

    } catch (error: any) {
        console.error('Error syncing Zoho contacts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
