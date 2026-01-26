const fs = require('fs');
const path = require('path');
const readline = require('readline');
const https = require('https');
const { URLSearchParams } = require('url');

const envPath = path.join(__dirname, '../.env.local');

// Helper to parse env file manually
function loadEnv() {
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf-8');
    const env = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            env[match[1].trim()] = match[2].trim();
        }
    });
    return env;
}

const env = loadEnv();
const CLIENT_ID = env.ZOHO_CLIENT_ID;
const CLIENT_SECRET = env.ZOHO_CLIENT_SECRET;
const ACCOUNTS_URL = env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
    console.log('--- Zoho Token Generator ---');

    if (!CLIENT_ID || !CLIENT_SECRET) {
        console.error('Error: ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET must be in .env.local');
        process.exit(1);
    }

    // 1. Get Redirect URI
    const redirectUri = await ask('Enter your Redirect URI (as configured in Zoho Console, e.g., http://localhost:3000): ');

    // 2. Generate Auth URL
    const scope = 'ZohoMail.messages.CREATE,ZohoMail.messages.READ,ZohoCalendar.event.CREATE,ZohoCalendar.event.READ';
    const authUrl = `${ACCOUNTS_URL}/oauth/v2/auth?scope=${scope}&client_id=${CLIENT_ID}&response_type=code&access_type=offline&redirect_uri=${encodeURIComponent(redirectUri)}`;

    console.log('\nPlease visit the following URL to authorize the app:');
    console.log('-----------------------------------------------------');
    console.log(authUrl);
    console.log('-----------------------------------------------------\n');

    // 3. Get Code
    const code = await ask('After accepting, copy the "code" parameter from the redirected URL and paste it here: ');

    // 4. Exchange for Token
    console.log('\nExchanging code for tokens...');

    const params = new URLSearchParams({
        code: code.trim(),
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
    });

    const req = https.request(`${ACCOUNTS_URL}/oauth/v2/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.error) {
                    console.error('\nAPI Error:', json.error);
                } else {
                    console.log('\nSUCCESS! Here are your credentials:');
                    console.log('-----------------------------------------------------');
                    console.log(`ZOHO_REFRESH_TOKEN=${json.refresh_token}`);
                    if (!json.refresh_token) {
                        console.log('(Note: No refresh_token returned. Did you already generate one? You might need to revoke access or use "access_type=offline" and force prompt.)');
                    }
                    console.log('-----------------------------------------------------');
                    console.log('Please add ZOHO_REFRESH_TOKEN to your .env.local file.');
                    console.log('Also ensure ZOHO_EMAIL is set to your sending address.');
                }
                rl.close();
            } catch (e) {
                console.error('Error parsing response:', e);
                rl.close();
            }
        });
    });

    req.on('error', (e) => {
        console.error('Request error:', e);
        rl.close();
    });

    req.write(params.toString());
    req.end();
}

main();
