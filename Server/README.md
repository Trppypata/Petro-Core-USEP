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
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. Start the development server:
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