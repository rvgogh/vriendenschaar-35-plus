
-- 1. Fix players update policy: add WITH CHECK to prevent user_id/knvb_member manipulation
DROP POLICY IF EXISTS "Allow users to update their own player profile" ON public.players;
CREATE POLICY "Allow users to update their own player profile"
ON public.players FOR UPDATE TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- 2. Add trigger to protect knvb_member from non-superuser changes
CREATE OR REPLACE FUNCTION public.protect_knvb_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If knvb_member is being changed, only allow superusers
  IF OLD.knvb_member IS DISTINCT FROM NEW.knvb_member THEN
    IF NOT has_role(auth.uid(), 'superuser') THEN
      NEW.knvb_member := OLD.knvb_member; -- Revert the change
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_knvb_member_trigger
BEFORE UPDATE ON public.players
FOR EACH ROW
EXECUTE FUNCTION public.protect_knvb_member();

-- 3. Fix key_holder policies: restrict to superusers
DROP POLICY IF EXISTS "Authenticated users can update key holder" ON public.key_holder;
CREATE POLICY "Superusers can update key holder"
ON public.key_holder FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'superuser'::app_role))
WITH CHECK (id = 1);

DROP POLICY IF EXISTS "Authenticated users can insert key holder" ON public.key_holder;
CREATE POLICY "Superusers can insert key holder"
ON public.key_holder FOR INSERT TO authenticated
WITH CHECK (id = 1 AND has_role(auth.uid(), 'superuser'::app_role));

-- 4. Remove hardcoded name-based superuser assignment
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Always assign default 'user' role to new users
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_role_after_player_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a player is linked to a user, ensure they have a role
  IF OLD.user_id IS NULL AND NEW.user_id IS NOT NULL THEN
    -- Only insert if no role exists yet
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
