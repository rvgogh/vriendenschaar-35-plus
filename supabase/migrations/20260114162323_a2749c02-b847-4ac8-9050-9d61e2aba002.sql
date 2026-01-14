-- Delete old push subscriptions that were created with old VAPID keys
-- These cannot work anymore since we changed the VAPID keys
DELETE FROM push_subscriptions 
WHERE created_at < '2026-01-14';