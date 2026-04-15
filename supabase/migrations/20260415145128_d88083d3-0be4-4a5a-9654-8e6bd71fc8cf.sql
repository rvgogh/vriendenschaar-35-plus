
SELECT cron.unschedule('send-training-reminders-daily');

SELECT cron.schedule(
  'send-training-reminders-daily',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ocsmgsowzecxetmhsgqo.supabase.co/functions/v1/send-training-reminders',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := concat('{"cron_secret": "', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1), '"}')::jsonb
  ) AS request_id;
  $$
);
