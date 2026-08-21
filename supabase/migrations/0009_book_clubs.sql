-- ============================================================
-- 0009_book_clubs.sql
-- Book clubs: groups of readers around a shared interest.
--
-- Three tables:
--   book_clubs     — one row per club (name, description, genre)
--   club_members   — join table with role (owner / member)
--   club_discussions — threaded posts inside a club
--
-- RLS rules:
--   book_clubs      — everyone reads, only signed-in users create
--   club_members    — everyone reads (for member counts), members
--                     create/delete their own membership, owners
--                     manage any membership in their club
--   club_discussions — members read, members create, authors
--                      update/delete their own posts
-- ============================================================

-- ── book_clubs ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.book_clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 2000),
  genre text NOT NULL DEFAULT 'general',
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.book_clubs ENABLE ROW LEVEL SECURITY;

-- Everyone can browse clubs (browse page is public).
DROP POLICY IF EXISTS "book_clubs_select" ON public.book_clubs;
CREATE POLICY "book_clubs_select" ON public.book_clubs
  FOR SELECT TO authenticated, anon USING (true);

-- Only signed-in users can create clubs.
DROP POLICY IF EXISTS "book_clubs_insert" ON public.book_clubs;
CREATE POLICY "book_clubs_insert" ON public.book_clubs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Only the creator (owner) can update their club.
DROP POLICY IF EXISTS "book_clubs_update" ON public.book_clubs;
CREATE POLICY "book_clubs_update" ON public.book_clubs
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- Only the creator can delete their club.
DROP POLICY IF EXISTS "book_clubs_delete" ON public.book_clubs;
CREATE POLICY "book_clubs_delete" ON public.book_clubs
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Fast search by name.
CREATE INDEX IF NOT EXISTS book_clubs_name_idx
  ON public.book_clubs (name);

-- ── club_members ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.club_members (
  club_id uuid NOT NULL REFERENCES public.book_clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (club_id, user_id)
);

ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

-- Everyone can see who's in a club (member counts on browse page).
DROP POLICY IF EXISTS "club_members_select" ON public.club_members;
CREATE POLICY "club_members_select" ON public.club_members
  FOR SELECT TO authenticated, anon USING (true);

-- Members can join (insert their own row). The clubs.js createClub
-- function inserts the owner row directly; joinClub inserts member rows.
DROP POLICY IF EXISTS "club_members_insert" ON public.club_members;
CREATE POLICY "club_members_insert" ON public.club_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Members can leave (delete their own row). Owners cannot leave via
-- this policy because the frontend blocks it, but the DB also guards
-- against it in the leaveClub function (neq('role', 'owner')).
DROP POLICY IF EXISTS "club_members_delete" ON public.club_members;
CREATE POLICY "club_members_delete" ON public.club_members
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Club owners can remove members from their club.
DROP POLICY IF EXISTS "club_members_owner_delete" ON public.club_members;
CREATE POLICY "club_members_owner_delete" ON public.club_members
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'owner'
    )
  );

-- ── club_discussions ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.club_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.book_clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.club_discussions ENABLE ROW LEVEL SECURITY;

-- Members can read discussions in their club.
DROP POLICY IF EXISTS "club_discussions_select" ON public.club_discussions;
CREATE POLICY "club_discussions_select" ON public.club_discussions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = club_discussions.club_id
        AND cm.user_id = auth.uid()
    )
  );

-- Also let anon read (so the page can show a "sign in to participate"
-- prompt rather than a blank wall — consistent with book_comments).
DROP POLICY IF EXISTS "club_discussions_select_anon" ON public.club_discussions;
CREATE POLICY "club_discussions_select_anon" ON public.club_discussions
  FOR SELECT TO anon USING (true);

-- Members can post discussions.
DROP POLICY IF EXISTS "club_discussions_insert" ON public.club_discussions;
CREATE POLICY "club_discussions_insert" ON public.club_discussions
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = club_discussions.club_id
        AND cm.user_id = auth.uid()
    )
  );

-- Authors can edit their own posts.
DROP POLICY IF EXISTS "club_discussions_update" ON public.club_discussions;
CREATE POLICY "club_discussions_update" ON public.club_discussions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Authors can delete their own posts.
DROP POLICY IF EXISTS "club_discussions_delete" ON public.club_discussions;
CREATE POLICY "club_discussions_delete" ON public.club_discussions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Newest discussions first per club.
CREATE INDEX IF NOT EXISTS club_discussions_club_id_created_at_idx
  ON public.club_discussions (club_id, created_at DESC);
