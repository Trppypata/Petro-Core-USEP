# Petro-Core Database Setup

This document describes how to set up the Petro-Core database tables and functions.

## Prerequisites

1. A Supabase project with admin access
2. Node.js and npm installed
3. Environment variables properly set up (.env file)

## Setting Up Environment Variables

Create a `.env` file in the root of the Server directory with the following:

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Make sure to use the service role key (not the anon key) to have the necessary permissions.

## Setting Up Database Tables

The project provides setup scripts to create the necessary tables:

### For Minerals Table

```bash
npm run setup:minerals
```

### For Rocks Table

```bash
npm run setup:rocks
```

If the scripts fail due to permission issues, you can manually execute the SQL:

1. Go to your Supabase dashboard
2. Open the SQL Editor
3. Copy the contents of `src/db/create_minerals_table.sql` or `src/db/create_rocks_table.sql`
4. Execute the SQL

## Setting Up Database Functions

The project uses Supabase RPC functions for bulk importing data:

```bash
npm run deploy:functions
```

This will deploy:
- `exec_sql` function (helper for executing SQL)
- `import_minerals` function (for importing minerals from Excel)
- `import_rocks` function (for importing rocks from Excel)

If you encounter issues, you can manually execute the SQL:

1. Go to your Supabase dashboard
2. Open the SQL Editor
3. Copy the contents of:
   - `src/db/create_exec_sql_function.sql`
   - `src/db/import_minerals_function.sql`
   - `src/db/import_rocks_function.sql`
4. Execute the SQL for each file in the order listed above

## Importing Sample Data

### Analyzing Excel Files

Before importing, you can analyze the Excel files:

```bash
# For minerals
npm run check:minerals
npm run analyze:minerals

# For rocks
npm run check:rocks
npm run analyze:rocks
```

These scripts will check the Excel files for potential issues and provide a summary of the data.

### Importing Data via API

Once the database is set up, you can import data using the API endpoints:

- `POST /api/minerals/import` - Upload an Excel file to import minerals
- `POST /api/rocks/import` - Upload an Excel file to import rocks

You can also use the UI in the Petro-Core application to import data.

## Troubleshooting

### Table Already Exists

If you run the setup scripts and the tables already exist, the scripts will skip creation.

### Permission Denied

If you encounter permission issues, make sure you're using the service role key in your `.env` file.

### Function Already Exists

If the functions already exist, the deployment script will update them.

### Invalid SQL

If you see "invalid SQL" errors, check the SQL files for syntax errors or incompatible SQL with your Supabase version.

## Database Schema

### Minerals Table

The minerals table stores all mineral data with fields like:
- mineral_code (unique identifier)
- mineral_name
- chemical_formula
- mineral_group
- etc.

### Rocks Table

The rocks table stores all rock data with fields like:
- rock_code (unique identifier)
- name
- type
- category
- etc.

Category-specific fields are also included for each rock type (Igneous, Sedimentary, Metamorphic, Ore Samples). 