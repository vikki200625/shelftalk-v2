-- ============================================================
-- 0006_book_comments.sql
-- Comments on books. One row per comment, keyed by the book's
-- short OpenLibrary work key (the /book/:key URL param, e.g.
-- 'OL45804W' — NOT the '/works/...' form books.ol_key uses).
--
-- No FK to books(ol_key) on purpose: the detail page is reachable
-- for ANY OpenLibrary work, including ones never added to the
-- books catalog, and a foreign key would reject comments there.
--
-- RLS matches the product rule "everyone can read, only signed-in
-- users can write, authors manage their own":
--   * SELECT — authenticated AND anon (visitors see the section)
--   * INSERT — authenticated, always as auth.uid()
--   * UPDATE / DELETE — the comment's own author only
-- ============================================================

CREATE TABLE IF NOT EXISTS public.book_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_key text NOT NULL,                -- short OL work key, e.g. 'OL45804W'
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.book_comments ENABLE ROW LEVEL SECURITY;

-- Everyone (even anonymous visitors) can read comments.
DROP POLICY IF EXISTS "book_comments_select" ON public.book_comments;
CREATE POLICY "book_comments_select" ON public.book_comments
  FOR SELECT TO authenticated, anon USING (true);

-- Only signed-in users can comment, always as themselves.
DROP POLICY IF EXISTS "book_comments_insert" ON public.book_comments;
CREATE POLICY "book_comments_insert" ON public.book_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Comment authors can edit and delete their own comments.
DROP POLICY IF EXISTS "book_comments_update" ON public.book_comments;
CREATE POLICY "book_comments_update" ON public.book_comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "book_comments_delete" ON public.book_comments;
CREATE POLICY "book_comments_delete" ON public.book_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Newest first per book.
CREATE INDEX IF NOT EXISTS book_comments_book_key_created_at_idx
  ON public.book_comments (book_key, created_at DESC);
