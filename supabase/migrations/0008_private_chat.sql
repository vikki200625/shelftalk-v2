-- Migration 0008: Private chat channels and messages
-- Private conversations between friends (mutual followers).

-- Chat channels (containers for conversations)
CREATE TABLE IF NOT EXISTS public.chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Channel participants (which users are in which channel)
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_id, user_id)
);

-- Private messages
CREATE TABLE IF NOT EXISTS public.private_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (length(message) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

-- Enable RLS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

-- Channel access: only participants can see their channels
DROP POLICY IF EXISTS "channels_select" ON public.chat_channels;
CREATE POLICY "channels_select" ON public.chat_channels
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.channel_id = chat_channels.id
      AND chat_participants.user_id = auth.uid()
    )
  );

-- Participants access: only you can see your own participations
DROP POLICY IF EXISTS "participants_select" ON public.chat_participants;
CREATE POLICY "participants_select" ON public.chat_participants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Anyone authenticated can create channels
DROP POLICY IF EXISTS "participants_insert" ON public.chat_participants;
CREATE POLICY "participants_insert" ON public.chat_participants
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Message access: only channel participants can see messages
DROP POLICY IF EXISTS "messages_select" ON public.private_messages;
CREATE POLICY "messages_select" ON public.private_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.channel_id = private_messages.channel_id
      AND chat_participants.user_id = auth.uid()
    )
  );

-- Only participants can send messages
DROP POLICY IF EXISTS "messages_insert" ON public.private_messages;
CREATE POLICY "messages_insert" ON public.private_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.channel_id = private_messages.channel_id
      AND chat_participants.user_id = auth.uid()
    )
  );

-- Sender can update their own messages (for read receipts)
DROP POLICY IF EXISTS "messages_update" ON public.private_messages;
CREATE POLICY "messages_update" ON public.private_messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id);

-- Sender can delete their own messages
DROP POLICY IF EXISTS "messages_delete" ON public.private_messages;
CREATE POLICY "messages_delete" ON public.private_messages
  FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- Indexes
CREATE INDEX IF NOT EXISTS chat_participants_channel_id_idx
  ON public.chat_participants (channel_id);
CREATE INDEX IF NOT EXISTS chat_participants_user_id_idx
  ON public.chat_participants (user_id);
CREATE INDEX IF NOT EXISTS private_messages_channel_id_created_at_idx
  ON public.private_messages (channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS private_messages_sender_id_idx
  ON public.private_messages (sender_id);
