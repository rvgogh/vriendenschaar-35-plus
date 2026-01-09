-- Delete attendance records for training 7-1-2026
DELETE FROM training_statuses WHERE training_id = 30;

-- Delete the training itself
DELETE FROM trainings WHERE id = 30;