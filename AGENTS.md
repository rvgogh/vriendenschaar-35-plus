# Architecture
- Store bar duties separately from attendance with two player slots per date; attendance changes must not alter bar assignments.
- Authorize bar duty management through existing superuser RLS and security-invoker scheduling functions; authenticated members may read the schedule.
- Balance bar assignments across all seasons by assignment count, using player ID as a stable tie-breaker.