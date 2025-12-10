-- Delete training statuses first (foreign key constraint)
DELETE FROM training_statuses WHERE training_id IN (28, 29);

-- Delete the trainings for Dec 24 and Dec 31
DELETE FROM trainings WHERE id IN (28, 29);