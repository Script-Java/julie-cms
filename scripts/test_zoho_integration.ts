// Run this with: npx tsx scripts/test_zoho_integration.ts
import { sendZohoEmail } from '../utils/zoho/mail';
import { listZohoCalendarEvents, createZohoCalendarEvent } from '../utils/zoho/calendar';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

async function main() {
    console.log('--- Starting Zoho Integration Test ---');

    if (!process.env.ZOHO_REFRESH_TOKEN) {
        console.error('❌ ZOHO_REFRESH_TOKEN is missing from .env.local');
        return;
    }
    if (!process.env.ZOHO_EMAIL) {
        console.error('❌ ZOHO_EMAIL is missing from .env.local');
        return;
    }

    // 1. Test Email
    try {
        console.log('\n📧 Testing Zoho Mail...');
        await sendZohoEmail({
            to: process.env.ZOHO_EMAIL, // Send to self
            subject: 'Zoho Integration Test',
            text: 'This is a test email from your Next.js app integration.',
        });
        console.log('✅ Email sent successfully!');
    } catch (error) {
        console.error('❌ Email failed:', error);
    }

    // 2. Test Calendar List
    try {
        console.log('\n📅 Testing Zoho Calendar List...');
        const events = await listZohoCalendarEvents();
        console.log(`✅ Retrieved ${events.events?.length || 0} events.`);
    } catch (error) {
        console.error('❌ Calendar list failed:', error);
    }

    console.log('\n--- Test Finished ---');
}

main();
