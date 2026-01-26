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

const runQuery = (sql) => new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    const req = https.request(options(data), (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => resolve(responseData));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
});

async function checkSchema() {
    console.log('🔍 Checking Schema...');
    const result = await runQuery(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name IN ('tasks', 'clients')
    ORDER BY table_name, ordinal_position;
  `);
    console.log(result);
}

checkSchema();
