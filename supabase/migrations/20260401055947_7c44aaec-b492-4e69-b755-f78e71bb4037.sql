
-- Remove old duplicate cron jobs
SELECT cron.unschedule('daily-training-reminder');
SELECT cron.unschedule('send-training-reminders-daily');

-- Create new cron job using service_role_key for proper authorization
SELECT cron.schedule(
  'send-training-reminders-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ocsmgsowzecxetmhsgqo.supabase.co/functions/v1/send-training-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
