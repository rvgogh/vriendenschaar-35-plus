-- Update season names
UPDATE seasons 
SET name = 'Najaars competitie ''26', updated_at = now()
WHERE name = 'Najaars competitie';

UPDATE seasons 
SET name = 'Voorjaars competitie ''25', updated_at = now()
WHERE name = 'Voorjaars competitie';