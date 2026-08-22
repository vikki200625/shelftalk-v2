# ShelfTalk v2 — ERD & RLS Matrix (from migrations 0001–0011)

Authoritative "should-be" schema, built strictly from `supabase/migrations/*.sql`.
Used to diff against the LIVE database during the 2026-08-22 feature audit.

## Entity Relationship Diagram

```mermaid
erDiagram
    auth_users ||--o| profiles : "on_auth_user_created trigger"
    profiles ||--o{ user_library : owns
    books ||--o{ user_library : "ol_key FK (0002)"
    profiles ||--o{ reading_goals : owns
    profiles ||--o{ user_follows : "follower_id"
    profiles ||--o{ user_follows : "following_id"
    profiles ||--o{ book_comments : writes
    profiles ||--o{ global_chat_messages : sends
    chat_channels ||--o{ chat_participants : has
    auth_users ||--o{ chat_participants : joins
    chat_channels ||--o{ private_messages : contains
    auth_users ||--o{ private_messages : "sender_id"
    profiles ||--o{ book_clubs : "created_by"
    book_clubs ||--o{ club_members : has
    profiles ||--o{ club_members : joins
    book_clubs ||--o{ club_discussions : hosts
    profiles ||--o{ club_discussions : posts
    profiles ||--o{ book_ratings : rates
    profiles ||--o{ notifications : "user_id (recipient)"
    profiles ||--o{ notifications : "actor_id (SET NULL)"
    book_clubs ||--o{ notifications : "club_id"

    profiles {
        uuid id PK "FK auth.users CASCADE"
        text username UK_NOT_NULL
        text email NOT_NULL_UK "0005"
        text display_name
        text avatar_url
        text bio
        timestamptz created_at
        timestamptz updated_at
    }
    books {
        text ol_key PK "'/works/OL...' form"
        text title NOT_NULL
        text author_name
        bigint cover_id
        integer first_publish_year
    }
    user_library {
        uuid id PK
        uuid user_id FK "->auth.users CASCADE"
        text ol_key FK "->books CASCADE"
        text status "want_to_read|reading|finished"
        integer progress_pages ">=0 default 0"
        smallint rating "1-5 nullable"
        date started_at
        date finished_at
    }
    reading_goals {
        uuid id PK
        uuid user_id FK
        integer year
        integer target ">0"
    }
    user_follows {
        uuid id PK
        uuid follower_id FK
        uuid following_id FK
    }
    book_comments {
        uuid id PK
        text book_key "SHORT key, NO FK on purpose"
        uuid user_id FK "->profiles"
        text body "1-2000 chars"
    }
    global_chat_messages {
        uuid id PK
        uuid user_id FK "->auth.users"
        text message "1-1000 chars"
    }
    chat_channels {
        uuid id PK
        timestamptz created_at
    }
    chat_participants {
        uuid id PK
        uuid channel_id FK CASCADE
        uuid user_id FK "->auth.users"
        UNIQUE_channel_user ""
    }
    private_messages {
        uuid id PK
        uuid channel_id FK CASCADE
        uuid sender_id FK "->auth.users"
        text message "1-1000"
        timestamptz read_at "nullable"
    }
    book_clubs {
        uuid id PK
        text name "1-100"
        text description "<=2000"
        text genre "default general"
        uuid created_by FK "->profiles"
    }
    club_members {
        uuid club_id PK_FK
        uuid user_id PK_FK
        text role "owner|member"
    }
    club_discussions {
        uuid id PK
        uuid club_id FK CASCADE
        uuid user_id FK "->profiles"
        text title "1-200"
        text body "1-5000"
    }
    book_ratings {
        uuid id PK
        uuid user_id FK "->profiles"
        text book_key "SHORT key, NO FK"
        smallint rating "1-5"
        text review_text "<=500 nullable"
    }
    notifications {
        uuid id PK
        uuid user_id FK "->profiles recipient"
        text type "follow|club_discussion"
        uuid actor_id FK "SET NULL"
        uuid club_id FK "CASCADE nullable"
        text message
        boolean read "default false"
    }
```

## RLS Policy Matrix ("should-be" per migrations)

Legend: ✅ = policy defined in migration · ⚠️ = **GAP in migration file** ·
`own` = `auth.uid() = user_id`-style self-scope · `pub` = public read incl. anon

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|---|---|---|---|---|
| profiles | pub | own | own | — | no delete policy (account deletion not supported) |
| books | pub | any-auth | any-auth (`USING(true)`) | — | shared catalog |
| user_library | own | own | own | own | fully private |
| reading_goals | own | own | own | own | col = `target` |
| user_follows | pub | own(follower) | — | own(follower) | no update; CHECK no-self-follow |
| book_comments | pub | own | own | own | short-key, no books FK |
| global_chat_messages | pub | own | own | own | col = `message` |
| chat_channels | participant-only | ⚠️ **NONE DEFINED** | ⚠️ none | ⚠️ none | **0008 bug: no INSERT policy → DMs can't start** |
| chat_participants | own rows only | own (`user_id=auth.uid()`) only | ⚠️ none | ⚠️ none | **⚠️ design flaw: creator cannot insert OTHER user's row → getOrCreateChannel always fails at step 2** |
| private_messages | participant-only | participant + sender=self | sender-only (`sender_id`) | sender-only | **⚠️ read receipts broken by design: markAsRead updates messages the RECIPIENT didn't send, but UPDATE requires `auth.uid() = sender_id`** |
| book_clubs | pub | own(created_by) | own(created_by) | own(created_by) | live DB drifted to owner_id — FIXED via rename |
| club_members | pub | own(user_id) | — | own + owner-of-club | roles owner/member |
| club_discussions | member + anon-pub | member(self) | author | author | |
| book_ratings | pub | own | own | own | upsert pattern in lib |
| notifications | own | `(own OR actor=self)` | own | own | cross-user inserts need actor arm |

## Migration-vs-LIVE drift found by audit (2026-08-22)

| # | Issue | Status |
|---|---|---|
| 1 | 0011 insert policy live was old own-rows-only version | FIXED (user ran actor-arm SQL) |
| 2 | 0007 global chat policies drifted live (insert rejected) | FIXED (user re-ran 4-policy SQL) |
| 3 | 0008 channels_insert missing live AND in migration file | FIXED live (user added WITH CHECK(true)) — migration file still needs patching |
| 4 | 0009 book_clubs live had owner_id instead of created_by | FIXED (RENAME COLUMN + policies + FK constraint rename) |
| 5 | Realtime dead project-wide: NO table in supabase_realtime publication | User ran ADD TABLE for 3 tables — verify in final audit run |
| 6 | 0008 participants_insert blocks adding other user | **OPEN — app-breaking**: getOrCreateChannel inserts [self, other]; second row violates policy. Fix options: (a) new policy allowing authenticated insert when channel freshly created / (b) SECURITY DEFINER function create_dm(user_a,user_b) returns channel_id — recommended |
| 7 | 0008 messages_update USING(sender_id) breaks read receipts | **OPEN — design bug**: recipient must be able to set read_at. Fix: `FOR UPDATE ... USING (participant) WITH CHECK (auth.uid() <> sender_id OR true)` — precisely: allow participants to update ONLY read_at of others' messages |

## Recommended fix for findings 6+7 (single SQL block)

```sql
-- Finding 6: let a channel creator add both participants.
-- Safe because channels are empty shells; privacy lives in SELECT policies.
DROP POLICY IF EXISTS "participants_insert" ON public.chat_participants;
CREATE POLICY "participants_insert" ON public.chat_participants
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.chat_channels c
      LEFT JOIN public.chat_participants cp ON cp.channel_id = c.id
      WHERE c.id = channel_id
      GROUP BY c.id
      HAVING COUNT(cp.id) = 0          -- channel is brand-new/empty
    )
  );

-- Finding 7: participants may set read_at on messages they did NOT send.
DROP POLICY IF EXISTS "messages_update" ON public.private_messages;
CREATE POLICY "messages_update" ON public.private_messages
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = sender_id
    OR EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.channel_id = private_messages.channel_id
        AND cp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- non-senders may only change read_at; everything else must be unchanged
    message = OLD.message IS NOT DISTINCT
      (SELECT message FROM public.private_messages pm WHERE pm.id = private_messages.id)
    OR auth.uid() = sender_id
  );
```

NOTE: The WITH CHECK clause above is intentionally conservative but hard to express
cleanly in one policy. Simpler production alternative (recommended): keep two policies —

```sql
-- senders: full edit of own messages
CREATE POLICY "messages_update_sender" ON public.private_messages
  FOR UPDATE TO authenticated USING (auth.uid() = sender_id);

-- recipients: column-restricted via trigger is cleanest, but RLS alone cannot
-- do column-level checks. Pragmatic compromise used by most Supabase apps:
-- allow participants to update; enforce read_at-only via BEFORE UPDATE trigger:
CREATE OR REPLACE FUNCTION public.guard_private_message_update()
RETURNS trigger AS $$
BEGIN
  IF NEW.sender_id <> auth.uid() THEN
    -- a non-sender touched this row: only read_at may differ
    IF NEW.message   IS DISTINCT FROM OLD.message
    OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
    OR NEW.channel_id IS DISTINCT FROM OLD.channel_id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'only read_at can be changed by non-senders';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS guard_pm_update ON public.private_messages;
CREATE TRIGGER guard_pm_update
  BEFORE UPDATE ON public.private_messages
  FOR EACH ROW EXECUTE FUNCTION public.guard_private_message_update();
```

## App-code mismatches vs migrations (found while auditing)

| File | Issue |
|---|---|
| src/lib/library.js | audit used `book_key`; actual col is `ol_key` — lib code is correct, script was wrong initially |
| scripts/audit-features.mjs | multiple probe bugs fixed during audit (RETURNING trap, role 'admin'→'owner', inverted leak labels) |
