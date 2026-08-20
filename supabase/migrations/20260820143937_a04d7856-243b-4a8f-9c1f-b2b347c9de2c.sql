DROP VIEW IF EXISTS public.my_player;
DROP VIEW IF EXISTS public.admin_players;

CREATE OR REPLACE FUNCTION public.get_my_player()
RETURNS TABLE (id integer, name text, knvb_member boolean, user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.knvb_member, p.user_id
  FROM public.players p
  WHERE auth.uid() IS NOT NULL AND p.user_id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.get_my_player() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_player() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_players()
RETURNS TABLE (id integer, name text, knvb_member boolean, user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.knvb_member, p.user_id
  FROM public.players p
  WHERE public.has_role(auth.uid(), 'superuser'::public.app_role)
  ORDER BY p.name
$$;

REVOKE ALL ON FUNCTION public.admin_list_players() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_players() TO authenticated;