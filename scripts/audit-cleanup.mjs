/**
 * Post-audit cleanup for ShelfTalk v2 (2026-08-22 feature audit).
 * Deletes all rows created during testing. Run once per account:
 *
 *   node scripts/audit-cleanup.mjs <email> <password>
 *
 * RLS-aware: each account can only delete its own rows; notifications
 * received by an account are deleted by that account (owner).
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const [email, password] = process.argv.slice(2)
if (!email || !password) {
  console.error('Usage: node scripts/audit-cleanup.mjs <email> <password>')
  process.exit(1)
}

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    })
)

const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
const { error: authErr } = await sb.auth.signInWithPassword({ email, password })
if (authErr) { console.error('signin failed:', authErr.message); process.exit(1) }
const uid = (await sb.auth.getUser()).data.user.id
console.log(`cleaning as ${uid.slice(0, 8)}…`)

let total = 0
async function wipe(label, table, query) {
  // count first (what we can see), then delete
  const { count } = await sb.from(table).select('id', { count: 'exact', head: true }).eq(...query[0])
  const del = await sb.from(table).delete().eq(...query[0])
  const ok = !del.error
  if (ok && count) total += count
  console.log(`${ok ? '✓' : '✗'} ${label}: ${count ?? 0} rows${del.error ? ` — ${del.error.message}` : ''}`)
}

// 1. follows this account created
await wipe('follows created', 'user_follows', [['follower_id', uid]])

// 2. ratings this account created (all were audit-created today)
await wipe('ratings', 'book_ratings', [['user_id', uid]])

// 3. library rows + goals (audit-created: Hobbit entry, target=20 goal)
await wipe('library rows', 'user_library', [['user_id', uid]])
await wipe('reading goals', 'reading_goals', [['user_id', uid]])

// 4. comments posted during audit
await wipe('comments', 'book_comments', [['user_id', uid]])

// 5. global chat messages sent during audit
{
  const { data } = await sb.from('global_chat_messages').select('id').eq('user_id', uid)
  let n = 0
  for (const m of data ?? []) {
    // only delete audit-flavored messages to be safe with real usage later
    const got = await sb.from('global_chat_messages').select('message').eq('id', m.id).single()
    if (/audit|probe|rt\d|standalone|col test|no-uid|hello world/i.test(got.data?.message ?? '')) {
      await sb.from('global_chat_messages').delete().eq('id', m.id)
      n++
    }
  }
  total += n
  console.log(`✓ global chat messages: ${n} of ${data?.length ?? 0} matched audit patterns`)
}

// 6. DM channels: leave them (they're empty shells + one real thread);
//    they're invisible without participants and harmless.
console.log('• DM channels left in place (harmless, invisible to others)')

// 7. clubs created by this account (cascades members/discussions/notifications)
{
  const { data: clubs } = await sb.from('book_clubs').select('id, name').eq('created_by', uid)
  let n = 0
  for (const c of clubs ?? []) {
    if (/Audit|probe/i.test(c.name)) {
      await sb.from('book_clubs').delete().eq('id', c.id)
      n++
    }
  }
  total += n
  console.log(`✓ audit clubs: ${n} of ${clubs?.length ?? 0}`)
}

// 8. club discussions authored during audit (any club)
await wipe('club discussions authored', 'club_discussions', [['user_id', uid]])
// membership rows
await wipe('club memberships', 'club_members', [['user_id', uid]])

// 9. notifications RECEIVED by this account (owner can delete own feed rows)
await wipe('notifications received', 'notifications', [['user_id', uid]])

console.log(`\nDONE — ${total} rows removed.`)
