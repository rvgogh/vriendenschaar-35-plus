# Architecture
- Store bar duties separately from attendance with two player slots per date; attendance changes must not alter bar assignments.
- Authorize bar duty management through existing superuser RLS and security-invoker validation triggers; authenticated members may read the schedule.
- Balance bar assignments across all seasons by assignment count, using player ID as a stable tie-breaker.
- Training module: one plan per training evening (`training_plans.training_id`), five blocks in a fixed 75-minute structure; the "rondje van Max" is always block 3 and cannot be swapped.
- Keep proposal and team rules in pure modules (`src/lib/trainingPlan.ts`, `src/lib/teamBuilder.ts`) with bun tests; pages only fetch, render and save.
- Closing game never has substitutes: up to 15 players two teams, from 16 players four teams on two fields; with an odd count one extra player joins the team that last conceded.
- Training tables are additive and separate from `players`: team/position in `player_training_info` (readable by members), level in `player_levels` (trainers only). Authorize with `is_trainer()` (role `trainer` or `superuser`); members read plans, blocks and teams only when published/shared.
- Training tables are not in the generated Supabase types yet; access them through `src/lib/trainingDb.ts`.
- Pending migrations for this module and the order to apply them: see `supabase/TRAINING-MODULE.md`. Apply them verbatim; do not rewrite them or alter existing tables.
