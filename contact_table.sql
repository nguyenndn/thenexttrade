-- Run this SQL in your Supabase SQL Editor to create the contact_messages table

CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Turn on Row Level Security
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow ANYONE (Public) to INSERT messages
CREATE POLICY "Allow public insert on contact_messages" 
ON contact_messages 
FOR INSERT 
TO public 
WITH CHECK (true);

-- (Optional) If you want to enable SELECT for admins later, you can add another policy
-- Since this table is currently just meant to receive public submissions, select/update 
-- will only be available to the service_role key or explicitly defined admin users.
