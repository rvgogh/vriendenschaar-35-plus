
-- Controleer of Roland gekoppeld is aan het account rvgogh@outlook.com
-- Als dit niet het geval is, koppel hem dan
UPDATE public.players 
SET user_id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'rvgogh@outlook.com'
)
WHERE LOWER(name) LIKE '%roland%' 
AND user_id IS NULL;

-- Toon de huidige koppelingen voor verificatie
SELECT 
  p.id,
  p.name,
  p.user_id,
  u.email
FROM public.players p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE LOWER(p.name) LIKE '%roland%';
