-- ============================================================
-- 0010_book_ratings.sql
-- Ratings and optional reviews on books. One row per user per
-- book (unique constraint), keyed by the book's short OpenLibrary
-- work key (e.g. 'OL45804W') — same convention as 0006.
--
-- No FK to books(ol_key) on purpose: the detail page is reachable
-- for ANY OpenLibrary work, including ones never added to the
-- books catalog, and a foreign key would reject ratings there.
--
-- RLS matches the product rule "everyone can read, only signed-in
-- users write as themselves, authors edit/delete their own":
--   * SELECT — authenticated AND anon (averages shown to visitors)
--   * INSERT — authenticated, always as auth.uid()
--   * UPDATE / DELETE — the rating's own author only
-- ============================================================

CREATE TABLE IF NOT EXISTS public.book_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  book_key text NOT NULL,                -- short OL work key, e.g. 'OL45804W'
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text text CHECK (length(review_text) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_key)
);

ALTER TABLE public.book_ratings ENABLE ROW LEVEL SECURITY;

-- Everyone (even anonymous visitors) can read ratings.
DROP POLICY IF EXISTS "book_ratings_select" ON public.book_ratings;
CREATE POLICY "book_ratings_select" ON public.book_ratings
  FOR SELECT TO authenticated, anon USING (true);

-- Only signed-in users can rate, always as themselves.
DROP POLICY IF EXISTS "book_ratings_insert" ON public.book_ratings;
CREATE POLICY "book_ratings_insert" ON public.book_ratings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Rating authors can edit and delete their own ratings.
DROP POLICY IF EXISTS "book_ratings_update" ON public.book_ratings;
CREATE POLICY "book_ratings_update" ON public.book_ratings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "book_ratings_delete" ON public.book_ratings;
CREATE POLICY "book_ratings_delete" ON public.book_ratings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Average + count per book, newest reviews first.
CREATE INDEX IF NOT EXISTS book_ratings_book_key_created_at_idx
  ON public.book_ratings (book_key, created_at DESC);
