-- Add subscription columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN subscription_tier text NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
ADD COLUMN credits_used integer NOT NULL DEFAULT 0,
ADD COLUMN credits_reset_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
ADD COLUMN is_admin boolean NOT NULL DEFAULT false;

-- Create payment requests table
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  requested_tier text not null check (requested_tier in ('pro', 'enterprise')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  reviewed_at timestamp with time zone,
  reviewed_by uuid references auth.users(id) on delete set null
);

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_requests TO authenticated;

-- Users can read their own requests
CREATE POLICY "users_read_own_payment_requests"
ON public.payment_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own requests
CREATE POLICY "users_insert_own_payment_requests"
ON public.payment_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can read all requests
CREATE POLICY "admins_read_all_payment_requests"
ON public.payment_requests
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
));

-- Admins can update any request
CREATE POLICY "admins_update_all_payment_requests"
ON public.payment_requests
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
));

-- Admins can update all profiles so they can change the tier
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id OR EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
))
WITH CHECK (auth.uid() = id OR EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
));
