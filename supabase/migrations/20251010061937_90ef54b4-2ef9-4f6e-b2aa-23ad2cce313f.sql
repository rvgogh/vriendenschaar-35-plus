-- Fix profiles table RLS policies to explicitly require authentication
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Superusers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superusers can update all profiles" ON public.profiles;

-- Create new policies with explicit authentication requirements
-- Users can view only their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = id
);

-- Users can update only their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = id
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = id
);

-- Superusers can view all profiles
CREATE POLICY "Superusers can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND public.has_role(auth.uid(), 'superuser'::app_role)
);

-- Superusers can update all profiles
CREATE POLICY "Superusers can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND public.has_role(auth.uid(), 'superuser'::app_role)
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND public.has_role(auth.uid(), 'superuser'::app_role)
);