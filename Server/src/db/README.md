# Database Functions

This directory contains SQL functions that need to be deployed to your Supabase instance.

## Deploying the Import Minerals Function

The `import_minerals_function.sql` file contains a stored procedure that bypasses row-level security (RLS) policies when importing minerals. This is necessary because the API needs to be able to insert records even when RLS would normally prevent it.

### Steps to Deploy

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `import_minerals_function.sql` into the editor
5. Run the query to create the function

## Testing the Function

Once deployed, you can test the function with the following SQL:

```sql
SELECT import_minerals('[
  {
    "mineral_code": "TEST-001",
    "mineral_name": "Test Mineral",
    "mineral_group": "Test Group",
    "category": "TEST",
    "type": "mineral"
  }
]');
```

## Troubleshooting

If you encounter issues with the function:

1. Check that your Supabase service role key has the necessary permissions
2. Verify that the minerals table structure matches the function's expected fields
3. Look for any errors in the Supabase logs
4. Test with a small batch of data first

## Security Considerations

This function uses `SECURITY DEFINER`, which means it runs with the permissions of the user who created it (typically the database owner). This bypasses RLS policies, so ensure your API endpoints are properly secured. 