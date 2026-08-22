-- ============================================================
-- 0012_user_follows_profiles_fks.sql
-- Linkage fix found during the 2026-08-22 integrity audit.
--
-- 0004 created user_follows with FKs to auth.users(id). That is
-- referentially fine (profiles.id mirrors auth.users.id), but
-- PostgREST can only embed across FKs between EXPOSED tables —
-- auth.users is not in the API schema, so `profiles!..._fkey`
-- embeds failed with "Could not find a relationship". Result:
-- FindFriends followers/following lists silently rendered empty.
--
-- Fix: replace the auth.users FKs with profiles(id) FKs using the
-- CANONICAL constraint names the app's join hints expect
-- (user_follows_follower_id_fkey / user_follows_following_id_fkey).
-- profiles.id is NOT NULL UNIQUE, so this is a drop-in swap; no
-- orphan rows existed at apply time (verified).
-- ============================================================

ALTER TABLE public.user_follows
  DROP CONSTRAINT IF EXISTS user_follows_follower_id_fkey;
ALTER TABLE public.user_follows
  DROP CONSTRAINT IF EXISTS user_follows_following_id_fkey;
ALTER TABLE public.user_follows
  DROP CONSTRAINT IF EXISTS user_follows_follower_id_fkey2;
ALTER TABLE public.user_follows
  DROP CONSTRAINT IF EXISTS user_follows_following_id_fkey2;

ALTER TABLE public.user_follows
  ADD CONSTRAINT user_follows_follower_id_fkey
  FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_follows
  ADD CONSTRAINT user_follows_following_id_fkey
  FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS user_follows_following_id_idx
  ON public.user_follows (following_id);
