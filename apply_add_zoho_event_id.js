#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// Try to read .env.local
let envContent = '';
try {
    envContent = fs.readFileSync('.env.local', 'utf8');
} catch (err) {
    console.error('Error reading .env.local:', err.message);
    process.exit(1);
}

const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/)?.[1]?.trim();
const accessToken = envContent.match(/SUPABASE_ACCESS_TOKEN\s*=\s*(.*)/)?.[1]?.trim();

if (!supabaseUrl || !accessToken) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];

if (!projectRef) {
    console.error('Could not extract project ref from URL');
    process.exit(1);
}

const options = (query) => ({
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${projectRef}/database/query`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Length': Buffer.byteLength(query)
    }
});

console.log('🔗 Adding zoho_event_id column to tasks...');

// Read the SQL file from the artifacts directory (absolute path known from context or copy it)
// I will assume I need to read the content directly from the variable I have or path
const sqlPath = '/home/gotham/.gemini/antigravity/brain/ba21835f-7354-4170-9129-620c1fb29b5b/add_zoho_event_id.sql';
let sql = '';
try {
    sql = fs.readFileSync(sqlPath, 'utf8');
} catch (err) {
    console.error('Error reading SQL file:', err.message);
    process.exit(1);
}

const queryData = JSON.stringify({ query: sql });

const req = https.request(options(queryData), (res) => {
    let responseData = '';
    res.on('data', (chunk) => responseData += chunk);
    res.on('end', () => {
        console.log('Result:', responseData);
    });
});

req.on('error', (e) => console.error(e));
req.write(queryData);
req.end();
