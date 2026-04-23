-- Add admin role and admin_emails table for access control

-- Add role column to contractors table (if not exists)
ALTER TABLE public.contractors
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Create admin_emails table to store approved admin email addresses
CREATE TABLE IF NOT EXISTS public.admin_emails (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed with admin email (ignore if already exists)
INSERT INTO public.admin_emails (email)
VALUES ('jegparker@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Create index for fast email lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_admin_emails_email ON public.admin_emails(email);
