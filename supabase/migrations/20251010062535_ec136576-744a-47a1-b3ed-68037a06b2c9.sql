-- Fix player_statuses table RLS policies to restrict unauthorized access
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all access for all users" ON public.player_statuses;

-- Allow authenticated users to view all player statuses (needed to see team availability)
CREATE POLICY "Authenticated users can view player statuses"
ON public.player_statuses
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
);

-- Users can insert status only for their own player_id
CREATE POLICY "Users can insert their own status"
ON public.player_statuses
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.players
    WHERE players.id = player_statuses.player_id
    AND players.user_id = auth.uid()
  )
);

-- Users can update status only for their own player_id
CREATE POLICY "Users can update their own status"
ON public.player_statuses
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.players
    WHERE players.id = player_statuses.player_id
    AND players.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.players
    WHERE players.id = player_statuses.player_id
    AND players.user_id = auth.uid()
  )
);

-- Only superusers can delete statuses
CREATE POLICY "Superusers can delete statuses"
ON public.player_statuses
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'superuser'::app_role)
);

-- Superusers get full access to all operations
CREATE POLICY "Superusers have full access"
ON public.player_statuses
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'superuser'::app_role)
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'superuser'::app_role)
);

-- Apply same fixes to training_statuses table
DROP POLICY IF EXISTS "Allow all access for all users on training_statuses" ON public.training_statuses;

CREATE POLICY "Authenticated users can view training statuses"
ON public.training_statuses
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can insert their own training status"
ON public.training_statuses
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.players
    WHERE players.id = training_statuses.player_id
    AND players.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own training status"
ON public.training_statuses
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.players
    WHERE players.id = training_statuses.player_id
    AND players.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.players
    WHERE players.id = training_statuses.player_id
    AND players.user_id = auth.uid()
  )
);

CREATE POLICY "Superusers can delete training statuses"
ON public.training_statuses
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'superuser'::app_role)
);

CREATE POLICY "Superusers have full training access"
ON public.training_statuses
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'superuser'::app_role)
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'superuser'::app_role)
);

-- Apply same fixes to event_statuses table
DROP POLICY IF EXISTS "Allow all access for all users on event_statuses" ON public.event_statuses;

CREATE POLICY "Authenticated users can view event statuses"
ON public.event_statuses
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can insert their own event status"
ON public.event_statuses
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.players
    WHERE players.id = event_statuses.player_id
    AND players.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own event status"
ON public.event_statuses
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.players
    WHERE players.id = event_statuses.player_id
    AND players.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.players
    WHERE players.id = event_statuses.player_id
    AND players.user_id = auth.uid()
  )
);

CREATE POLICY "Superusers can delete event statuses"
ON public.event_statuses
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'superuser'::app_role)
);

CREATE POLICY "Superusers have full event access"
ON public.event_statuses
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'superuser'::app_role)
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'superuser'::app_role)
);