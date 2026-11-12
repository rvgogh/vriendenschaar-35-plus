DO $$
DECLARE
  target_user uuid;
BEGIN
  SELECT user_id INTO target_user FROM public.players WHERE id = 8 AND name = 'Luuk';
  IF target_user IS NULL THEN
    RAISE EXCEPTION 'Luuk heeft geen gekoppeld account';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user AND role IN ('trainer', 'superuser')) THEN
    UPDATE public.user_roles SET role = 'trainer'::public.app_role WHERE user_id = target_user AND role = 'user'::public.app_role;
    IF NOT FOUND THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (target_user, 'trainer'::public.app_role);
    END IF;
  END IF;
  IF NOT public.is_trainer(target_user) THEN
    RAISE EXCEPTION 'Trainersrol voor Luuk kon niet worden bevestigd';
  END IF;
END;
$$;