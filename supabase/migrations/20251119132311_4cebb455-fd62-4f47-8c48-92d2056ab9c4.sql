-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the job to run every day at 9:00 AM UTC
-- This will check for trainings happening in 2 days and send notifications
SELECT cron.schedule(
  'send-training-reminders-daily',
  '0 9 * * *', -- Every day at 9:00 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://ocsmgsowzecxetmhsgqo.supabase.co/functions/v1/send-training-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jc21nc293emVjeGV0bWhzZ3FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NjYzMDUsImV4cCI6MjA2NTU0MjMwNX0.xEz8_P8f1GU8Pb3p__Lt7Qs51rxHWPgMNDSNma90k7I'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);