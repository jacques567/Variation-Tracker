-- Add category support to jobs
-- Add category column to jobs table
ALTER TABLE public.jobs
ADD COLUMN category TEXT NULL;

-- Create job_categories table for managing categories per contractor
CREATE TABLE public.job_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (contractor_id, name)
);

-- Enable RLS on job_categories
ALTER TABLE public.job_categories ENABLE ROW LEVEL SECURITY;

-- RLS: Contractors can only see their own categories
CREATE POLICY "Contractors can view their own categories"
  ON public.job_categories FOR SELECT
  USING (auth.uid() = contractor_id);

-- RLS: Contractors can insert their own categories
CREATE POLICY "Contractors can create categories"
  ON public.job_categories FOR INSERT
  WITH CHECK (auth.uid() = contractor_id);

-- RLS: Contractors can delete their own categories
CREATE POLICY "Contractors can delete their own categories"
  ON public.job_categories FOR DELETE
  USING (auth.uid() = contractor_id);
