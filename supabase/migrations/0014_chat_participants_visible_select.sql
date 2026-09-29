-- ============================================================
-- 0014_chat_participants_visible_select.sql
-- Third layer of the same defect, exposed while verifying 0013
-- (2026-09-29): chat_participants SELECT policy is own-rows-only,
-- so getUserChannels() can see MY row for a channel but not the
-- OTHER participant's row → it skips every channel → /messages
-- still renders "No conversations yet" even with 0013 applied.
--
-- The policy cannot just subquery chat_participants itself —
-- Postgres raises infinite-recursion (42P17) when a policy on T
-- queries T. Standard fix: a SECURITY DEFINER helper that reads
-- as the function owner (table owner → RLS not applied), then a
-- single SELECT policy: own rows OR any row inside a channel I
-- belong to.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_channel_member(p_channel uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE channel_id = p_channel AND user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_channel_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_channel_member(uuid) TO authenticated;

-- Sweep every existing SELECT policy on chat_participants (live
-- names have drifted from migration files before — see 0009/0013).
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT polname
    FROM pg_policy
    WHERE polrelid = 'public.chat_participants'::regclass
      AND polcmd = 's'          -- SELECT
  LOOP
    EXECUTE format('DROP POLICY %I ON public.chat_participants', p.polname);
  END LOOP;
END $$;

CREATE POLICY participants_select ON public.chat_participants
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_channel_member(channel_id)
  );
