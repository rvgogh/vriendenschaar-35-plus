-- 1. Lock down trigger functions: they must only run from triggers, never be callable via the API
REVOKE ALL ON FUNCTION public.assign_role_after_player_link() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_user_profile_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_knvb_member() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_event_season() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- has_role is required by RLS policies for signed-in users; remove anonymous access only
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 2. players: column level privileges so user_id (auth account id) is not readable by everyone
REVOKE SELECT ON public.players FROM anon, authenticated;
GRANT SELECT (id, name, knvb_member) ON public.players TO authenticated;

-- Own player record (includes user_id) via a scoped view
CREATE OR REPLACE VIEW public.my_player AS
SELECT p.id, p.name, p.knvb_member, p.user_id
FROM public.players p
WHERE p.user_id = auth.uid();

REVOKE ALL ON public.my_player FROM PUBLIC, anon;
GRANT SELECT ON public.my_player TO authenticated;

-- Admin-only view exposing the account linkage, gated on the superuser role
CREATE OR REPLACE VIEW public.admin_players AS
SELECT p.id, p.name, p.knvb_member, p.user_id
FROM public.players p
WHERE public.has_role(auth.uid(), 'superuser'::public.app_role);

REVOKE ALL ON public.admin_players FROM PUBLIC, anon;
GRANT SELECT ON public.admin_players TO authenticated;

-- 3. key_holder: restrict visibility to superusers
DROP POLICY IF EXISTS "Authenticated users can view key holder" ON public.key_holder;
CREATE POLICY "Superusers can view key holder"
ON public.key_holder FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'superuser'::public.app_role));