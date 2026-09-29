-- ============================================================
-- 0013_chat_profiles_fks.sql
-- Found by the 2026-09-29 whole-app design review (Pass 1, 1B).
--
-- Same bug class as 0012: chat_participants.user_id and
-- global_chat_messages.user_id were created against auth.users(id)
-- (0007, 0008). PostgREST can only embed across FKs between EXPOSED
-- tables, so `profiles:user_id(...)` embeds fail with
-- "Could not find a relationship" — and the app swallows that error:
--   * getUserChannels() skips every channel → /messages ALWAYS
--     renders "No conversations yet" (live-probed 2026-09-29)
--   * global chat has no username join → every other person shows
--     as the literal label "User"
--
-- Fix: recreate both FKs against profiles(id) (same UUID space;
-- profiles.id is the public identity) with canonical constraint
-- names. The drops sweep pg_constraint for any FK touching the
-- column instead of naming one constraint — the live schema has
-- drifted from migration files before (see 0009 owner_id), so a
-- fixed-name DROP could silently miss.
-- ============================================================

DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.chat_participants'::regclass
      AND contype = 'f'
      AND pg_get_constraintdef(oid) LIKE 'FOREIGN KEY (user_id)%'
  LOOP
    EXECUTE format('ALTER TABLE public.chat_participants DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE public.chat_participants
  ADD CONSTRAINT chat_participants_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.global_chat_messages'::regclass
      AND contype = 'f'
      AND pg_get_constraintdef(oid) LIKE 'FOREIGN KEY (user_id)%'
  LOOP
    EXECUTE format('ALTER TABLE public.global_chat_messages DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE public.global_chat_messages
  ADD CONSTRAINT global_chat_messages_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
