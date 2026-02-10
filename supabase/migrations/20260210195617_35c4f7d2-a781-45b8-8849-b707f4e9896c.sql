UPDATE training_statuses 
SET verified_at = NULL, verified_latitude = NULL, verified_longitude = NULL 
WHERE player_id = 18 
AND training_id IN (
  SELECT id FROM trainings WHERE training_at > now()
);