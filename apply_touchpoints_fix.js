#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const accessToken = envContent.match(/SUPABASE_ACCESS_TOK[RN]+ = (.*)/)?.[1]?.trim();

const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];

const options = (query) => ({
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${projectRef}/database/query`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Length': query.length
    }
});

console.log('🔗 Applying Touchpoints Fix...');

const sql = fs.readFileSync('fix_touchpoints.sql', 'utf8');

const req = https.request(options(JSON.stringify({ query: sql })), (res) => {
    let responseData = '';
    res.on('data', (chunk) => responseData += chunk);
    res.on('end', () => {
        console.log('Result:', responseData);
    });
});

req.on('error', (e) => console.error(e));
req.write(JSON.stringify({ query: sql }));
req.end();
