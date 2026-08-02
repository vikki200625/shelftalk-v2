-- Migration 0007: Global chat messages
-- Global chat room where all users can see and send messages.

CREATE TABLE IF NOT EXISTS public.global_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (length(message) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.global_chat_messages ENABLE ROW LEVEL SECURITY;

-- Everyone can read global messages
DROP POLICY IF EXISTS "global_chat_select" ON public.global_chat_messages;
CREATE POLICY "global_chat_select" ON public.global_chat_messages
  FOR SELECT TO authenticated, anon USING (true);

-- Only signed-in users can send messages
DROP POLICY IF EXISTS "global_chat_insert" ON public.global_chat_messages;
CREATE POLICY "global_chat_insert" ON public.global_chat_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Only sender can delete their own messages
DROP POLICY IF EXISTS "global_chat_delete" ON public.global_chat_messages;
CREATE POLICY "global_chat_delete" ON public.global_chat_messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Only sender can update their own messages (for read receipts)
DROP POLICY IF EXISTS "global_chat_update" ON public.global_chat_messages;
CREATE POLICY "global_chat_update" ON public.global_chat_messages
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Index for chronological order
CREATE INDEX IF NOT EXISTS global_chat_messages_created_at_idx
  ON public.global_chat_messages (created_at DESC);
