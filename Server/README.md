# Petro Core Server

This is the backend server for the Petro Core application.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=8000
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Running the Server

For Windows users:
```
run-server.bat
```

For other platforms:
```
npm run dev
```

## Importing Minerals from Excel

The server includes functionality to import minerals data from Excel files into the Supabase database.

### Setup Minerals Table

Before importing, you need to set up the minerals table in your Supabase database:

**Option 1: Using the Supabase SQL Editor (Recommended)**

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Create a new query
4. Copy the contents of `Server/src/migrations/minerals_table.sql`
5. Run the query

**Option 2: Using the Script (Requires additional setup)**

To use the script, you first need to create an `exec_sql` function in your Supabase database:

1. Open the SQL Editor in your Supabase dashboard
2. Run the following SQL:
   ```sql
   CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
   RETURNS void
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   BEGIN
     EXECUTE sql_query;
   END;
   $$;
   
   -- Grant execute permissions
   GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
   ```

3. Then run the setup script:
   ```
   npm run setup:minerals
   ```

### Import Minerals from Default Excel File

To import minerals from the default Excel file (`DK_MINERALS_DATABASE.xlsx`):

```
npm run import:minerals
```

This will read the Excel file located at `Server/src/excel/DK_MINERALS_DATABASE.xlsx` and import all minerals into the database.

### API Endpoints for Minerals

The server provides the following API endpoints for minerals:

- `POST /api/minerals/import` - Import minerals from an uploaded Excel file
  - Requires a `file` field in a multipart/form-data request
- `POST /api/minerals/import-default` - Import minerals from the default Excel file
- `GET /api/minerals` - Get all minerals
- `POST /api/minerals` - Add a new mineral
- `PUT /api/minerals/:id` - Update a mineral
- `DELETE /api/minerals/:id` - Delete a mineral

## Using the Import API

You can use tools like Postman or a frontend form to upload Excel files:

1. Send a POST request to `http://localhost:8000/api/minerals/import`
2. Set the Content-Type to `multipart/form-data`
3. Add a form field with the name `file` and select your Excel file
4. Send the request

### Excel File Format

The Excel file should follow this format:
- Each sheet represents a category of minerals (e.g., SULFATES, BORATES)
- The first row should contain column headers like:
  - Mineral Code
  - Mineral Name
  - Chemical Formula
  - Mineral Group
  - Color
  - Streak
  - Luster
  - Hardness
  - Cleavage
  - Fracture
  - Habit
  - Crystal System
  - etc.

## Fixing the Row-Level Security (RLS) Issue

If you encounter errors like `Error: new row violates row-level security policy for table "minerals"` when importing minerals, follow these steps:

### Option 1: Deploy the Database Function (Recommended)

This method uses a stored procedure that bypasses RLS policies:

1. Run the deploy script:
```
npm run deploy:functions
```

2. Alternatively, manually deploy the function:
   - Go to your Supabase dashboard
   - Navigate to the SQL Editor
   - Copy the contents of `src/db/import_minerals_function.sql`
   - Execute the SQL

### Option 2: Modify RLS Policies

If you prefer to adjust your RLS policies instead:

1. Go to your Supabase dashboard
2. Navigate to Authentication > Policies
3. Find the `minerals` table
4. Create a new policy:
   - Name: `Allow insert from API`
   - Operation: `INSERT`
   - Target roles: `authenticated`, `service_role`
   - Policy definition: `true` (or a more restrictive condition if needed)

### Option 3: Use the Service Role Key

The server is already configured to use the service role key, which should bypass RLS. If you're still experiencing issues:

1. Check that your `.env` file contains the correct `SUPABASE_SERVICE_ROLE_KEY`
2. Make sure you're using the full key, not the anon key
3. Restart the server after making any changes

## Troubleshooting

If you continue to experience issues:

1. Check the Supabase logs for any errors
2. Verify that your database schema matches the expected structure
3. Ensure your service role key has the necessary permissions
4. Try importing a small batch of minerals first to identify any specific issues

## Migrations

### Fixing Minerals Table Issues

If you're encountering issues with the minerals functionality, particularly a 400 Bad Request error mentioning "Could not find the 'user' column of 'minerals' in the schema cache", you need to run the following migrations:

1. First, ensure your environment variables are properly set up:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY`: Your Supabase service role key (not the anon key)

2. Run the migration to add the user column to the minerals table:

```bash
node src/migrations/add-user-column-minerals.js
```

3. Run the migration to create RPC functions for safer mineral operations:

```bash
node src/migrations/create-mineral-rpc-functions.js
```

These migrations will:
- Add a 'user' column to the minerals table
- Set up Row Level Security policies
- Create RPC functions to handle mineral operations safely

After running these migrations, the minerals functionality should work correctly.

### Alternative: Manual Database Update

If you prefer to update the database directly through the Supabase interface:

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Run the following SQL command:

```sql
-- Add user column if it doesn't exist
ALTER TABLE minerals
ADD COLUMN IF NOT EXISTS "user" UUID REFERENCES auth.users(id);

-- Enable Row Level Security
ALTER TABLE minerals ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to see all minerals
DROP POLICY IF EXISTS "Minerals are viewable by everyone" ON minerals;
CREATE POLICY "Minerals are viewable by everyone" 
  ON minerals FOR SELECT 
  USING (true);
  
-- Create policy for authenticated users to insert their own minerals
DROP POLICY IF EXISTS "Users can insert their own minerals" ON minerals;
CREATE POLICY "Users can insert their own minerals" 
  ON minerals FOR INSERT 
  TO authenticated 
  WITH CHECK ("user" = auth.uid());
  
-- Create policy for authenticated users to update their own minerals
DROP POLICY IF EXISTS "Users can update their own minerals" ON minerals;
CREATE POLICY "Users can update their own minerals" 
  ON minerals FOR UPDATE 
  TO authenticated 
  USING ("user" = auth.uid());
  
-- Create policy for authenticated users to delete their own minerals
DROP POLICY IF EXISTS "Users can delete their own minerals" ON minerals;
CREATE POLICY "Users can delete their own minerals" 
  ON minerals FOR DELETE 
  TO authenticated 
  USING ("user" = auth.uid());
``` 