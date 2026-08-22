# ShelfTalk v2 — ERD & RLS Matrix

**Status: LIVE-VERIFIED 2026-08-22** — every table, policy, and relationship below was
exercised against the production database during the full feature audit (67/67 green).
Built from migrations 0001–0011 **plus** post-audit live fixes (documented at bottom).

## Entity Relationship Diagram

```mermaid
erDiagram
    auth_users ||--o| profiles : "on_auth_user_created trigger"
    profiles ||--o{ user_library : owns
    books ||--o{ user_library : "ol_key FK"
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
    profiles ||--o{ notifications : "user_id = recipient"
    profiles ||--o| notifications : "actor_id (SET NULL)"
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
        text ol_key PK "short work key e.g. OL45804W"
        text title NOT_NULL
        text author_name
        bigint cover_id
        integer first_publish_year
    }
    user_library {
        uuid id PK
        uuid user_id FK "auth.users CASCADE"
        text ol_key FK "books CASCADE"
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
        uuid following_id FK "CHECK no self-follow"
    }
    book_comments {
        uuid id PK
        text book_key "short key - NO FK on purpose"
        uuid user_id FK "->profiles"
        text body "1-2000 chars"
    }
    global_chat_messages {
        uuid id PK
        uuid user_id FK "auth.users"
        text message "1-1000 chars"
    }
    chat_channels {
        uuid id PK
        timestamptz created_at
    }
    chat_participants {
        uuid id PK
        uuid channel_id FK "CASCADE"
        uuid user_id FK "auth.users"
        uniq_channel_user "UNIQUE channel_id user_id"
    }
    private_messages {
        uuid id PK
        uuid channel_id FK "CASCADE"
        uuid sender_id FK "auth.users"
        text message "1-1000"
        timestamptz read_at "nullable - receipts"
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
        uuid club_id FK "CASCADE"
        uuid user_id FK "->profiles"
        text title "1-200"
        text body "1-5000"
    }
    book_ratings {
        uuid id PK
        uuid user_id FK "->profiles"
        text book_key "short key - NO FK"
        smallint rating "1-5 CHECK"
        text review_text "<=500 nullable"
        uniq_user_book "UNIQUE user_id book_key"
    }
    notifications {
        uuid id PK
        uuid user_id FK "recipient CASCADE"
        text type "follow|club_discussion CHECK"
        uuid actor_id FK "SET NULL"
        uuid club_id FK "CASCADE nullable"
        text message NOT_NULL
        boolean read "default false"
    }
```

## Database functions & triggers (part of the contract)

| Object | Type | Purpose |
|---|---|---|
| `create_dm_channel(other_user uuid) → uuid` | SECURITY DEFINER fn | Atomic DM creation: reuses an existing channel for the pair or creates channel + both participant rows in one transaction. **The only supported way to start a DM** — client-side inserts cannot satisfy correct RLS (creator can't insert the other user's participant row). App entry point: `getOrCreateChannel()` in `src/lib/chat.js`. |
| `guard_private_message_update()` | BEFORE UPDATE trigger on private_messages | Non-senders may only change `read_at`; any other column change by a non-sender raises. Makes read receipts possible without giving recipients free edit access. |
| `handle_new_user()` | AFTER INSERT trigger on auth.users | Auto-creates the profile row from signup metadata (`username`). |

## RLS Policy Matrix — LIVE as of 2026-08-22

Legend: `own` = scoped to `auth.uid()` · `pub` = public read incl. anon.
All rows verified by live probes during the audit.

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | pub | own | own | — |
| books | pub | any-auth | any-auth | — |
| user_library | own | own | own | own |
| reading_goals | own | own | own | own |
| user_follows | pub | own(follower) | — | own(follower) |
| book_comments | pub | own | own | own |
| global_chat_messages | pub | own (`user_id`) | own | own |
| chat_channels | participants only | authenticated (`WITH CHECK true`) | — | — |
| chat_participants | own rows only | own (`user_id`) — pair inserted via definer rpc | — | — |
| private_messages | participants only | participant + `sender_id = auth.uid()` | sender full edit; participants `read_at`-only via trigger | sender only |
| book_clubs | pub | own(`created_by`) | own(`created_by`) | own(`created_by`) |
| club_members | pub | own(`user_id`) | — | own + club owner |
| club_discussions | members + anon | member(self) | author | author |
| book_ratings | pub | own | own | own |
| notifications | own | `(own OR actor_id = auth.uid())` | own | own |

**Realtime:** `notifications`, `global_chat_messages`, `private_messages` are in the
`supabase_realtime` publication — INSERT events deliver to subscribed clients (verified live).

## Post-audit live fixes applied 2026-08-22 (all verified)

| # | Issue found | Fix applied |
|---|---|---|
| 1 | Live 0011 notifications insert policy was stale own-rows-only version — cross-user notifications rejected | Recreated with `WITH CHECK ((auth.uid() = user_id) OR (auth.uid() = actor_id))` |
| 2 | Global chat insert RLS-blocked (policy drift from 0007) | Dropped + recreated all four policies per migration file |
| 3 | Migration 0008 never defined a channels INSERT policy — DMs could never start | Added `channels_insert ... WITH CHECK (true)`; creation now flows through `create_dm_channel()` rpc |
| 4 | Live `book_clubs` had `owner_id`, code sends `created_by` (schema drift from older 0009 revision) | `RENAME COLUMN owner_id TO created_by` + recreated insert/update/delete policies + renamed FK constraint to `book_clubs_created_by_fkey` |
| 5 | Realtime dead project-wide — no table in `supabase_realtime` publication | `ALTER PUBLICATION supabase_realtime ADD TABLE` ×3; delivery confirmed |
| 6 | Read receipts impossible — messages UPDATE was sender-only, but receipts are set by the *recipient* | Participant-scope UPDATE policy + `guard_private_message_update()` trigger restricting non-senders to `read_at` only |

## Known intentional quirks

- `book_comments.book_key`, `book_ratings.book_key`, `user_library.ol_key`: comments/ratings
  use the **short** OpenLibrary key with no FK to `books` (detail page reachable for any OL
  work, catalog or not); library uses the **long** `/works/OL...` form WITH an FK.
- `notifications.actor_id` is SET NULL on actor deletion — feed renders "Someone ..." for
  deleted actors; `actor_username` resolution falls back client-side.
- DM channels are never deleted (no UI for it); they're invisible without a participant row,
  so orphans are harmless.
