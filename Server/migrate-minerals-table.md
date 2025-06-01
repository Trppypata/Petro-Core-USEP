# Minerals Table Migration

This document provides instructions for fixing the "user column" error in the minerals table.

## The Issue

When adding or updating minerals, you may encounter this error:
```
Failed to load resource: the server responded with a status of 400 (Bad Request)
Error adding mineral: Failed to add mineral: Could not find the 'user' column of 'minerals' in the schema cache
```

This happens because Supabase is expecting a user column in the minerals table, which doesn't exist. We need to add this column.

## Running the Migration Script

1. Make sure you have Node.js installed.

2. Navigate to the Server directory:
   ```bash
   cd Server
   ```

3. Make sure your `.env` file contains the Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_service_key
   ```

4. Run the migration script:
   ```bash
   node add-user-column-minerals.js
   ```

5. Restart your server:
   ```bash
   npm run start
   ```

## What the Migration Does

1. Checks if the `user` column already exists in the `minerals` table
2. If it doesn't exist, adds a new UUID column named `user` with a foreign key reference to `auth.users(id)`
3. Creates two RPC functions:
   - `insert_mineral` - For safely inserting minerals with user data
   - `update_mineral` - For safely updating minerals with user data

## Manual Fix (if needed)

If you have direct database access, you can also run this SQL command:

```sql
ALTER TABLE minerals ADD COLUMN IF NOT EXISTS "user" UUID REFERENCES auth.users(id) NULL;
```

## Verification

After running the migration, try adding or updating a mineral. The error should be resolved. 