# Supabase RLS Policies Fix

## Problem
The task and client creation features are failing with errors related to **schema cache** and **Row Level Security (RLS)** policies. The error message indicates Supabase cannot see the table columns.

## Quick Fix Steps

### Step 1: Verify Table Structure
First, make sure your tables have the correct columns:

1. Go to your Supabase dashboard: https://pqxpjiyrchtkfiolfotb.supabase.co
2. Click on "Table Editor" in the left sidebar
3. Click on the `tasks` table
4. Verify it has these columns:
   - `id` (uuid, primary key)
   - `title` (text)
   - `description` (text, nullable)
   - `priority` (text)
   - `status` (text)
   - `client_id` (uuid, nullable, foreign key to clients)
   - `due_at` (timestamp, nullable)
   - `completed_at` (timestamp, nullable)
   - `created_at` (timestamp)

If any columns are missing, you need to add them.

### Step 2: Refresh Schema Cache
After verifying the table structure:

1. In the Supabase dashboard, go to "SQL Editor"
2. Run this command to refresh the schema cache:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```
3. Wait a few seconds for the cache to refresh

### Step 3: Add RLS Policies
You need to add RLS policies to your Supabase database. Go to your Supabase dashboard and run these SQL commands:

### For the `tasks` table:

```sql
-- Allow authenticated users to insert tasks
CREATE POLICY "Enable insert for authenticated users" 
ON tasks 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to view their tasks
CREATE POLICY "Enable read for authenticated users" 
ON tasks 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to update tasks
CREATE POLICY "Enable update for authenticated users" 
ON tasks 
FOR UPDATE 
TO authenticated 
USING (true);

-- Allow authenticated users to delete tasks
CREATE POLICY "Enable delete for authenticated users" 
ON tasks 
FOR DELETE 
TO authenticated 
USING (true);
```

### For the `clients` table:

```sql
-- Allow authenticated users to insert clients
CREATE POLICY "Enable insert for authenticated users" 
ON clients 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to view clients
CREATE POLICY "Enable read for authenticated users" 
ON clients 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to update clients
CREATE POLICY "Enable update for authenticated users" 
ON clients 
FOR UPDATE 
TO authenticated 
USING (true);

-- Allow authenticated users to delete clients
CREATE POLICY "Enable delete for authenticated users" 
ON clients 
FOR DELETE 
TO authenticated 
USING (true);
```

## How to Apply

1. Go to your Supabase dashboard: https://pqxpjiyrchtkfiolfotb.supabase.co
2. Click on "SQL Editor" in the left sidebar
3. Create a new query
4. Copy and paste all the SQL commands above
5. Click "Run" to execute

## Alternative: Disable RLS (NOT RECOMMENDED for production)

If you're just testing and want to quickly disable RLS (not recommended for production):

```sql
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
```

## Verification

After applying the policies:
1. Go to http://localhost:3000/tasks/new
2. Try creating a new task
3. It should now work without errors!

## Additional Tables

You may also need to apply similar policies to other tables in your database. Check the Supabase dashboard for:
- `interactions`
- `growth_metrics`
- Any other custom tables you have

For each table, you can run similar `CREATE POLICY` commands as shown above.

## Troubleshooting

### Issue: "Could not find the 'client_id' column"
This error means Supabase's schema cache doesn't know about the column. This can happen if:
1. **The column doesn't exist**: Go to Table Editor and add the missing column
2. **Schema cache is stale**: Run `NOTIFY pgrst, 'reload schema';` in SQL Editor
3. **RLS is too restrictive**: The policies above should fix this

### Issue: "Permission denied for table tasks"
This means RLS is enabled but you don't have policies. Run the RLS policy SQL commands above.

### Issue: Still not working after applying policies?
1. **Check if policies exist**: Go to Authentication → Policies in the Supabase dashboard
2. **Verify you're logged in**: Make sure you can access `/dashboard` without being redirected to login
3. **Check browser console**: Look for more detailed error messages
4. **Restart your Next.js dev server**: Sometimes the connection needs to be refreshed
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

### Issue: Policies already exist
If you get an error saying the policy already exists, you can either:
1. Drop the existing policy first:
   ```sql
   DROP POLICY "Enable insert for authenticated users" ON tasks;
   ```
2. Or skip creating that specific policy

## Need More Help?
If you're still having issues, check:
- Your `.env.local` file has the correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Your Supabase project is not paused
- You have an active internet connection to Supabase
