-- Fix season names
UPDATE seasons 
SET name = 'Najaars competitie ''25', updated_at = now()
WHERE name = 'Najaars competitie ''26';

UPDATE seasons 
SET name = 'Voorjaars competitie ''26', updated_at = now()
WHERE name = 'Voorjaars competitie ''25';