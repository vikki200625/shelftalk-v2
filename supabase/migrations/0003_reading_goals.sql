-- ============================================================
-- 0003_reading_goals.sql
-- Yearly reading goals: "read N books in 2026".
--
-- Differs from the old repo on purpose:
--  * Old repo stored only (user, year, target). Progress was
--    computed elsewhere and drifted. We keep the same shape but
--    the app computes progress live from user_library
--    (status = 'finished' count) — one source of truth, no
--    stored counter to go stale.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reading_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year integer NOT NULL,
  target integer NOT NULL CHECK (target > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, year)
);

ALTER TABLE public.reading_goals ENABLE ROW LEVEL SECURITY;

-- Goals are personal: only you can see or edit yours.
DROP POLICY IF EXISTS "goals_select" ON public.reading_goals;
CREATE POLICY "goals_select" ON public.reading_goals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "goals_insert" ON public.reading_goals;
CREATE POLICY "goals_insert" ON public.reading_goals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "goals_update" ON public.reading_goals;
CREATE POLICY "goals_update" ON public.reading_goals
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "goals_delete" ON public.reading_goals;
CREATE POLICY "goals_delete" ON public.reading_goals
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS goals_set_updated_at ON public.reading_goals;
CREATE TRIGGER goals_set_updated_at
  BEFORE UPDATE ON public.reading_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
