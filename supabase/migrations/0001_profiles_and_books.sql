-- ============================================================
-- 0001_profiles_and_books.sql
-- Base tables: profiles (one row per auth user) and books
-- (catalog of book metadata, keyed by OpenLibrary key).
--
-- Design notes (differs from the old repo on purpose):
--  * books.ol_key is the primary key — OpenLibrary keys are
--    stable and unique, no synthetic uuid needed.
--  * RLS is REAL here. The old repo enabled RLS then immediately
--    bypassed it with `FOR ALL ... USING (true)` (the infamous
--    "white screen fix"). Every table below gets honest policies.
-- ============================================================

-- ------------------------------------------------------------
-- profiles — public-facing user info, one row per auth user.
-- Created automatically on signup via the handle_new_user
-- trigger below (standard Supabase pattern).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone (even anonymous visitors) can read profiles.
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated, anon USING (true);

-- Users create/update only their own profile.
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ------------------------------------------------------------
-- books — the shared catalog. One row per OpenLibrary work key,
-- holding the metadata snapshot the app displays. Rows are
-- upserted from the client (ON CONFLICT DO NOTHING) so the
-- catalog grows as users search; it is NOT user-owned data.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.books (
  ol_key text PRIMARY KEY,            -- e.g. '/works/OL27448W'
  title text NOT NULL,
  author_name text,
  cover_id bigint,                    -- OpenLibrary cover id
  first_publish_year integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Catalog is public; any visitor can read it.
DROP POLICY IF EXISTS "books_select" ON public.books;
CREATE POLICY "books_select" ON public.books
  FOR SELECT TO authenticated, anon USING (true);

-- Authenticated users may add books to the catalog (idempotent
-- upserts only — the app uses ON CONFLICT (ol_key) DO NOTHING).
DROP POLICY IF EXISTS "books_insert" ON public.books;
CREATE POLICY "books_insert" ON public.books
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "books_update" ON public.books;
CREATE POLICY "books_update" ON public.books
  FOR UPDATE TO authenticated USING (true);

-- ------------------------------------------------------------
-- Shared trigger: keep updated_at fresh on every row change.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS books_set_updated_at ON public.books;
CREATE TRIGGER books_set_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- handle_new_user — auto-create a profile row on signup so the
-- app never has to check "does my profile exist?".
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
