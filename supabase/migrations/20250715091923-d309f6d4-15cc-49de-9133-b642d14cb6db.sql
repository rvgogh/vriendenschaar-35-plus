
-- Zoek de user_id van de gebruiker met het opgegeven email adres en maak deze superuser
-- Eerst controleren of de gebruiker bestaat en een rol heeft
WITH user_info AS (
  SELECT id as user_id 
  FROM auth.users 
  WHERE email = 'rvgogh@outlook.com'
)
-- Update de bestaande rol naar superuser, of voeg een nieuwe toe als deze niet bestaat
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'superuser'::app_role
FROM user_info
ON CONFLICT (user_id, role) 
DO UPDATE SET role = 'superuser'::app_role
WHERE user_roles.user_id IN (SELECT user_id FROM user_info);

-- Als er geen bestaande rol was, voeg dan een nieuwe toe
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'superuser'::app_role
FROM (
  SELECT id as user_id 
  FROM auth.users 
  WHERE email = 'rvgogh@outlook.com'
  AND id NOT IN (SELECT user_id FROM public.user_roles)
) AS new_users;
