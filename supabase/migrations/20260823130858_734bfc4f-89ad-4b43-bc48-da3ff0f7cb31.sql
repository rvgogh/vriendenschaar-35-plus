CREATE OR REPLACE FUNCTION public.is_my_player(_player_id integer)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.id = _player_id AND p.user_id = auth.uid()
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_my_player(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_my_player(integer) TO authenticated, service_role;

DROP POLICY IF EXISTS "Users can insert their own status" ON public.player_statuses;
DROP POLICY IF EXISTS "Users can update their own status" ON public.player_statuses;
CREATE POLICY "Users can insert their own status" ON public.player_statuses
  FOR INSERT TO authenticated
  WITH CHECK (public.is_my_player(player_id));
CREATE POLICY "Users can update their own status" ON public.player_statuses
  FOR UPDATE TO authenticated
  USING (public.is_my_player(player_id))
  WITH CHECK (public.is_my_player(player_id));

DROP POLICY IF EXISTS "Users can insert their own training status" ON public.training_statuses;
DROP POLICY IF EXISTS "Users can update their own training status" ON public.training_statuses;
CREATE POLICY "Users can insert their own training status" ON public.training_statuses
  FOR INSERT TO authenticated
  WITH CHECK (public.is_my_player(player_id));
CREATE POLICY "Users can update their own training status" ON public.training_statuses
  FOR UPDATE TO authenticated
  USING (public.is_my_player(player_id))
  WITH CHECK (public.is_my_player(player_id));

DROP POLICY IF EXISTS "Users can insert their own event status" ON public.event_statuses;
DROP POLICY IF EXISTS "Users can update their own event status" ON public.event_statuses;
CREATE POLICY "Users can insert their own event status" ON public.event_statuses
  FOR INSERT TO authenticated
  WITH CHECK (public.is_my_player(player_id));
CREATE POLICY "Users can update their own event status" ON public.event_statuses
  FOR UPDATE TO authenticated
  USING (public.is_my_player(player_id))
  WITH CHECK (public.is_my_player(player_id));