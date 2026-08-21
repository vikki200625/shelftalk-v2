-- ============================================================
-- 0011_notifications.sql
-- Per-user notification feed. Rows are created by the app layer
-- (profiles.js on follow, clubs.js on club discussion) — no DB
-- triggers, keeping write paths explicit and testable.
--
-- actor_id is the person who caused the notification; ON DELETE
-- SET NULL so deleting a profile keeps the feed intact ("deleted
-- user ..."), while club_id cascades with its club.
--
-- RLS: strict owner-only access. Unlike book_ratings there is no
-- public read — a user's notification feed is private.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('follow', 'club_discussion')),
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  club_id uuid REFERENCES book_clubs(id) ON DELETE CASCADE,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users see only their own notifications.
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Signed-in users can insert a notification either for themselves OR
-- as themselves (actor_id = auth.uid()) for someone else. The first
-- arm covers direct inserts; the second is what makes cross-user
-- notifications possible at all: a follow or club-discussion
-- notification has user_id = recipient != auth.uid(), so a plain
-- "own rows only" CHECK would reject every such insert. Requiring
-- actor_id = auth.uid() keeps attribution honest — you can only
-- notify as yourself, never impersonate another actor.
-- (The app layer is responsible for not notifying the actor.)
DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
CREATE POLICY "notifications_insert_own" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id) OR (auth.uid() = actor_id));

-- Users can mark their own notifications as read (and edit nothing else
-- of consequence — UPDATE is scoped to own rows).
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Users can delete their own notifications.
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Serves the two hot queries: unread count and recent feed.
CREATE INDEX IF NOT EXISTS notifications_user_read_created_idx
  ON public.notifications (user_id, read, created_at DESC);
