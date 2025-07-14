
-- Maak een enum voor de verschillende rollen
CREATE TYPE public.app_role AS ENUM ('user', 'superuser');

-- Maak een user_roles tabel
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS op user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Maak een security definer functie om rollen te checken (voorkomt recursieve RLS issues)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Policy zodat gebruikers hun eigen rollen kunnen zien
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy zodat superusers alle rollen kunnen zien
CREATE POLICY "Superusers can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'superuser'));

-- Maak een trigger functie om automatisch een user rol toe te kennen bij registratie
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Trigger die de functie uitvoert na het koppelen van een speler aan een user
CREATE OR REPLACE FUNCTION public.assign_role_after_player_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Trigger op players tabel voor wanneer user_id wordt geupdate
CREATE TRIGGER on_player_user_linked
  AFTER UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_role_after_player_link();

-- Update RLS policy voor players om superusers toe te staan alle spelers te bewerken
CREATE POLICY "Superusers can update any player profile"
ON public.players
FOR UPDATE
USING (public.has_role(auth.uid(), 'superuser'));
