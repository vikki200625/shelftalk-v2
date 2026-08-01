-- ============================================================
-- 0002_user_library.sql
-- The personal library: one row per (user, book) with a shelf
-- status and reading progress. This is the heart of the app —
-- "want to read / reading / finished" with progress.
--
-- Differs from the old repo on purpose:
--  * Old repo had book_lists + book_list_items (generic lists).
--    The vision is a library with three shelves, so we model
--    that directly: status column + UNIQUE(user_id, ol_key).
--    Generic user lists can be added later if needed.
--  * Old repo's list_items RLS was `USING (true)` — anyone could
--    delete anyone's list items. Here every policy is scoped to
--    the owning user.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ol_key text NOT NULL REFERENCES public.books(ol_key) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'want_to_read'
    CHECK (status IN ('want_to_read', 'reading', 'finished')),
  progress_pages integer NOT NULL DEFAULT 0 CHECK (progress_pages >= 0),
  rating smallint CHECK (rating BETWEEN 1 AND 5),
  started_at date,
  finished_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, ol_key)
);

-- Index for the common query: "everything on this user's shelf".
CREATE INDEX IF NOT EXISTS idx_library_user ON public.user_library (user_id, status);

ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;

-- Your library is yours: only you can read or change it.
DROP POLICY IF EXISTS "library_select" ON public.user_library;
CREATE POLICY "library_select" ON public.user_library
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "library_insert" ON public.user_library;
CREATE POLICY "library_insert" ON public.user_library
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "library_update" ON public.user_library;
CREATE POLICY "library_update" ON public.user_library
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "library_delete" ON public.user_library;
CREATE POLICY "library_delete" ON public.user_library
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS library_set_updated_at ON public.user_library;
CREATE TRIGGER library_set_updated_at
  BEFORE UPDATE ON public.user_library
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
