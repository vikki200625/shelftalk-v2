# Supabase schema (new app)

Fresh migrations for the ShellTalk rebuild. Written from scratch, using the
old repo's `/home/vikki/shelftalk/migration_*.sql` as *reference only* — the
old files had real problems this set fixes:

| Old repo problem | This set |
|---|---|
| RLS enabled then bypassed with `FOR ALL ... USING (true)` ("white screen fix") | Real per-user policies on every table |
| `books` table with synthetic uuid, never in the repo | `books.ol_key` primary key (OpenLibrary keys are stable) |
| `DROP TABLE ... CASCADE` inside migrations | Idempotent `CREATE TABLE IF NOT EXISTS` only |
| Goal progress stored as a counter that drifted | Progress computed live from `user_library` |
| No unfollow/delete policy for follows | Full CRUD scoped to the owner |

## Scope (deliberate)

Only the tables the next few slices need:

- `0001` — `profiles` (auto-created on signup) + `books` catalog + shared
  `updated_at` trigger
- `0002` — `user_library`: want_to_read / reading / finished, progress,
  rating — `UNIQUE(user_id, ol_key)`
- `0003` — `reading_goals` (yearly target)
- `0004` — `user_follows`

Clubs, chat, analytics, notes are NOT ported yet — they arrive with their
slices (vertical-slice rule). The old migrations for them are in
`/home/vikki/shelftalk/` when the time comes.

## How to apply

No Supabase CLI / Docker on this machine, so the simplest path is the
dashboard:

1. Create a free Supabase project (no credit card needed on the free plan).
2. SQL Editor → paste each file **in order** (0001 → 0002 → 0003 → 0004),
   run them.
3. Copy the project URL + anon key into `.env` (the frontend reads these
   when the auth/library slice lands).

Each file is idempotent (IF NOT EXISTS + DROP POLICY IF EXISTS), so
re-running is safe.
