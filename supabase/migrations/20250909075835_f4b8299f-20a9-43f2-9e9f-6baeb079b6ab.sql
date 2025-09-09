-- Fix search path for existing functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Geef Roland automatisch superuser rechten op basis van de gekoppelde speler naam
  IF EXISTS (
    SELECT 1 FROM public.players 
    WHERE user_id = NEW.id AND LOWER(name) LIKE '%roland%'
  ) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'superuser');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.assign_role_after_player_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Check of dit een nieuwe koppeling is (user_id was NULL en wordt nu gevuld)
  IF OLD.user_id IS NULL AND NEW.user_id IS NOT NULL THEN
    -- Verwijder eventuele bestaande rol
    DELETE FROM public.user_roles WHERE user_id = NEW.user_id;
    
    -- Geef Roland superuser rechten
    IF LOWER(NEW.name) LIKE '%roland%' THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.user_id, 'superuser');
    ELSE
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.user_id, 'user');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_user_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    email = NEW.email,
    updated_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;