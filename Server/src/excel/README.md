# Excel Files for Mineral Import

This directory contains Excel files that can be used to import mineral data into the Supabase database.

## Available Files

- `DK_MINERALS_DATABASE.xlsx` - Contains detailed information about minerals organized by category.
- `Database.xlsx` - General database file for other rock types.

## How to Import Minerals

### Step 1: Set Up the Minerals Table

First, you need to set up the minerals table in your Supabase database:

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Create a new query
4. Copy the contents of `Server/src/migrations/minerals_table.sql`
5. Run the query

### Step 2: Import the Data

You have two options to import the data:

#### Option 1: Using the API

1. Start the server with `npm run dev`
2. Make a POST request to `http://localhost:8000/api/minerals/import-default`
3. This will import all minerals from `DK_MINERALS_DATABASE.xlsx`

#### Option 2: Using the Script

Run the import script:

```
npm run import:minerals
```

### Step 3: Verify the Import

Make a GET request to `http://localhost:8000/api/minerals` to verify that the minerals were imported correctly.

## Excel File Format

The Excel files should follow this format:

- Each sheet represents a category of minerals (e.g., SULFATES, BORATES)
- The first row should contain column headers:
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

## Creating Your Own Excel Files

If you want to create your own Excel files for import, follow these guidelines:

1. Each sheet should represent a category of minerals or rocks
2. The first row should contain the column headers as listed above
3. Each subsequent row should represent a mineral or rock
4. Save the file as an .xlsx file
5. You can then import it using the API: `POST http://localhost:8000/api/minerals/import` 