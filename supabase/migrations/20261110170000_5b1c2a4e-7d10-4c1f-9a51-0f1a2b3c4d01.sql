-- Training-module 1/3: nieuwe rol 'trainer'.
-- Staat apart omdat een nieuwe enumwaarde eerst vastgelegd moet zijn voordat ze gebruikt wordt.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'trainer';
