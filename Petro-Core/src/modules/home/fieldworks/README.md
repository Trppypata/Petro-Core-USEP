# Fieldworks Module

This module provides functionality for displaying and managing field work materials and assignments.

## Setup Instructions

The fieldworks feature requires several Supabase resources to be properly configured:

1. Database Tables:
   - `fieldworks`: Stores general information about each field work
   - `fieldwork_sections`: Stores sections for each field work
   - `fieldwork_files`: Stores PDF files associated with each section

2. Storage Bucket:
   - `fieldworks`: A public storage bucket for storing PDF files

## Setting Up the Fieldworks Feature

### Option 1: Automated Setup (Recommended)

Run the provided setup script from the Server directory:

```bash
cd Server
npm run setup:fieldworks
```

This script will:
- Check if the necessary database function exists
- Create the required database tables if they don't exist
- Create the storage bucket if it doesn't exist
- Insert sample data if no fieldworks exist

### Option 2: Manual Setup

If the automated setup doesn't work, you can set up the fieldworks feature manually:

1. Create the `exec_sql` database function:
   - Go to the Supabase dashboard SQL Editor
   - Run the SQL from `Server/src/db/create_exec_sql_function.sql`

2. Create the fieldworks tables:
   - Run the SQL from `Server/src/db/create_fieldworks_tables.sql`

3. Create the fieldworks storage bucket:
   - Go to Storage in the Supabase dashboard
   - Create a new bucket named `fieldworks`
   - Set it to public
   - Set up policies to allow authenticated users to read/write

4. Add sample data (optional):
   - Go to the Table Editor for the `fieldworks` table
   - Insert sample records with `title`, `description`, and `path` fields

## Database Schema

### fieldworks Table
- `id`: UUID (primary key)
- `title`: Text (required)
- `description`: Text
- `path`: Text (unique, required)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### fieldwork_sections Table
- `id`: UUID (primary key)
- `fieldwork_id`: UUID (foreign key to fieldworks.id)
- `title`: Text (required)
- `order`: Integer
- `created_at`: Timestamp
- `updated_at`: Timestamp

### fieldwork_files Table
- `id`: UUID (primary key)
- `title`: Text (required)
- `description`: Text
- `fieldwork_id`: UUID (foreign key to fieldworks.id)
- `section_id`: UUID (foreign key to fieldwork_sections.id)
- `file_url`: Text (required)
- `file_type`: Text ('chapter' or 'assignment')
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Usage

### Viewing Field Works

1. Navigate to the Field Works page (`/field-works`)
2. Browse the available field works
3. Click on a field work to view its details
4. Expand sections to see materials and assignments
5. Click on file links to view or download PDFs

### Managing Field Works (Admin)

Field works can be managed through the Admin Files page (`/admin/files`):

1. Create new field works
2. Create sections within field works
3. Upload PDF files as materials or assignments
4. Edit or delete existing field works, sections, and files

## Troubleshooting

If you encounter issues with the fieldworks feature:

1. Check the browser console for error messages
2. Verify that all required tables exist in the Supabase database
3. Verify that the fieldworks storage bucket exists and is publicly accessible
4. Check that the storage bucket policies allow file reading and writing
5. Try running the setup script: `npm run setup:fieldworks`

For persistent issues, you may need to check the Supabase logs or contact your database administrator. 