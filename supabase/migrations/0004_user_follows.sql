-- ============================================================
-- 0004_user_follows.sql
-- Reader-to-reader follows: the social layer's first table.
--
-- Differs from the old repo on purpose:
--  * Old repo let `anon` read the full follow graph. A follow
--    relationship is genuinely public data (who follows whom is
--    shown on profiles), so SELECT stays open — but only
--    authenticated users may create/delete their own follows.
--  * The old repo had no way to stop following (no DELETE
--    policy) — added here.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)  -- can't follow yourself
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Follows are public (profiles show follower counts), so SELECT
-- is open to everyone.
DROP POLICY IF EXISTS "follows_select" ON public.user_follows;
CREATE POLICY "follows_select" ON public.user_follows
  FOR SELECT TO authenticated, anon USING (true);

-- You manage your own outgoing follows only.
DROP POLICY IF EXISTS "follows_insert" ON public.user_follows;
CREATE POLICY "follows_insert" ON public.user_follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "follows_delete" ON public.user_follows;
CREATE POLICY "follows_delete" ON public.user_follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);
