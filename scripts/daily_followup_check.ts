
import { createClient } from '@supabase/supabase-js';
import { createZohoDraft } from '../utils/zoho/mail';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
    console.log('--- Starting Daily Follow-up Check ---');

    const now = new Date().toISOString();

    // 1. Find clients due for follow-up
    const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .lte('next_followup_at', now);

    if (error) {
        console.error('❌ Failed to fetch clients:', error);
        return;
    }

    console.log(`Found ${clients.length} clients due for follow-up.`);

    for (const client of clients) {
        if (!client.email || !client.user_id) {
            console.warn(`⚠️ Skipping client ${client.id} (missing email or user_id)`);
            continue;
        }

        try {
            console.log(`Creating draft for ${client.name} (${client.email})...`);

            const subject = `Follow up: ${client.name}`;
            const content = `Hi ${client.name.split(' ')[0]},\n\nHope you're doing well. Just wanted to check in...\n\nBest,\n[Your Name]`;

            await createZohoDraft(client.user_id, client.email, subject, content);
            console.log(`✅ Draft created for ${client.name}`);

            // Update next_followup_at to avoid re-creating drafts immediately?
            // Or maybe separate "Draft Created" status?
            // For now, let's bump it by 1 day or leave it. 
            // Better: Add tags or just leave it. 
            // User requested: "A Supabase Edge Function runs daily... creates a Draft"
            // If we don't update DB, it will create another draft tomorrow if not sent.
            // Let's not update DB automatically to force user to review.

        } catch (err: any) {
            console.error(`❌ Failed to create draft for ${client.name}:`, err.message);
        }
    }

    console.log('--- Finished ---');
}

main();
