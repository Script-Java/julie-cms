const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Parse DB URL from env or construct it.
// Usually Supabase provides a direct connection string or transaction pooler string.
// We'll try to find it in .env.local

const connectionString = process.env.DATABASE_URL || `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${process.env.NEXT_PUBLIC_SUPABASE_URL.split('.')[0].replace('https://', '')}.supabase.co:5432/postgres`;

console.log("Attempting to connect to database...");

const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false } // Supabase requires SSL
});

async function run() {
    try {
        await client.connect();
        console.log("Connected.");

        const sqlPath = path.join(__dirname, '../supabase/migrations/20260125_create_user_integrations.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query(sql);
        console.log("Migration executed successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

run();
