-- Function to execute arbitrary SQL
-- This is used by our setup scripts to create tables and other database objects
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the creator
AS $$
BEGIN
    EXECUTE sql_query;
    RETURN jsonb_build_object('success', true, 'message', 'SQL executed successfully');
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error executing SQL: ' || SQLERRM,
            'error', SQLERRM,
            'context', sql_query
        );
END;
$$;

-- Grant execute permission to authenticated users
-- This allows our API to execute SQL via this function
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO service_role; 