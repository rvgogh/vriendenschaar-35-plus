DO $$
DECLARE existing_job_id bigint;
BEGIN
  SELECT jobid INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'send-training-reminders-daily';

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;
END $$;

SELECT cron.schedule(
  'send-training-reminders-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ocsmgsowzecxetmhsgqo.supabase.co/functions/v1/send-training-reminders',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('cron_secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1))
  ) AS request_id;
  $$
);