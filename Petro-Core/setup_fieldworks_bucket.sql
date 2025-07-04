    -- Run this in the SQL Editor of Supabase to create the fieldworks bucket
    -- and set up appropriate permissions

    -- 1. First, create the bucket if it doesn't exist
    -- Note: This requires admin privileges
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('fieldworks', 'fieldworks', true)
    ON CONFLICT (id) DO NOTHING;

    -- 2. Enable row-level security
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

    -- 3. Create policies to allow authenticated users to perform operations
    -- Policy to allow anyone to read files in the fieldworks bucket
    CREATE POLICY "Fieldworks files are publicly accessible" 
    ON storage.objects FOR SELECT
    USING (bucket_id = 'fieldworks');

    -- Policy to allow authenticated users to upload files
    CREATE POLICY "Users can upload to fieldworks" 
    ON storage.objects FOR INSERT   
    TO authenticated
    WITH CHECK (bucket_id = 'fieldworks');

    -- Policy to allow users to update their own files
    CREATE POLICY "Users can update their own fieldworks files" 
    ON storage.objects FOR UPDATE 
    TO authenticated
    USING (bucket_id = 'fieldworks' AND (auth.uid() = owner OR auth.uid() IN (
        SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )));

    -- Policy to allow users to delete their own files
    CREATE POLICY "Users can delete their own fieldworks files" 
    ON storage.objects FOR DELETE 
    TO authenticated
    USING (bucket_id = 'fieldworks' AND (auth.uid() = owner OR auth.uid() IN (
        SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )));

    -- Create fieldworkpdf folder if it doesn't exist (this is just a placeholder)
    INSERT INTO storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, path_tokens)
    VALUES 
    (gen_random_uuid(), 'fieldworks', 'fieldworkpdf/.keep', auth.uid(), now(), now(), now(), '{}', '{fieldworkpdf,".keep"}')
    ON CONFLICT DO NOTHING; 