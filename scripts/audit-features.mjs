/**
 * Live end-to-end feature audit for ShelfTalk v2.
 * Exercises EVERY feature's real queries against the live Supabase
 * with two throwaway accounts (audA, audB) and prints PASS/FAIL per check.
 *
 * Run: node scripts/audit-features.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    })
)

const url = env.VITE_SUPABASE_URL
const anon = env.VITE_SUPABASE_ANON_KEY
if (!url || !anon) { console.error('Missing .env values'); process.exit(1) }

let passCount = 0, failCount = 0
function check(name, ok, detail = '') {
  if (ok) { passCount++; console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ''}`) }
  else { failCount++; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
function section(t) { console.log(`\n=== ${t} ===`) }

const stamp = Date.now()

// Usage: node scripts/audit-features.mjs <emailA> <passA> <emailB> <passB> [usernameA] [usernameB]
// Existing accounts are signed into; missing accounts get created (requires email confirmation off).
const args = process.argv.slice(2)
const emailA = args[0] ?? `audit_a_${stamp}@test.example`
const pwA = args[1] ?? 'AuditPass!9x7'
const emailB = args[2] ?? `audit_b_${stamp}@test.example`
const pwB = args[3] ?? 'AuditPass!9x7'

const A = createClient(url, anon)
const B = createClient(url, anon)

// ================================================================
section('AUTH')
// ================================================================
const unameA = args[4] ?? `audit_a_${stamp}`
const unameB = args[5] ?? `audit_b_${stamp}`
{
  // Sign up exactly like SignUp.jsx does (username via options.data → trigger).
  // If the account already exists, skip straight to signin.
  const pre = await createClient(url, anon).from('profiles').select('email').in('email', [emailA, emailB])
  const existing = new Set((pre.data ?? []).map(p => p.email))

  if (existing.has(emailA)) {
    check('user A already exists — skipping signup', true)
  } else {
    const sA = await A.auth.signUp({ email: emailA, password: pwA, options: { data: { username: unameA } } })
    check('signup A (email confirmation off)', !sA.error && !!sA.data.user?.id, sA.error?.message)
  }
  if (existing.has(emailB)) {
    check('user B already exists — skipping signup', true)
  } else {
    const sB = await B.auth.signUp({ email: emailB, password: pwB, options: { data: { username: unameB } } })
    check('signup B (email confirmation off)', !sB.error && !!sB.data.user?.id, sB.error?.message)
  }

  const rA = await A.auth.signInWithPassword({ email: emailA, password: pwA })
  check('signin A', !rA.error, rA.error?.message)
  const rB = await B.auth.signInWithPassword({ email: emailB, password: pwB })
  check('signin B', !rB.error, rB.error?.message)

  // SignIn-page flow: username → profiles.email lookup → password login
  const { data: lookup } = await A.from('profiles').select('email').eq('username', unameB).maybeSingle()
  check('username→email lookup works', !!lookup?.email)
}

const uidA = (await A.auth.getUser()).data.user?.id
const uidB = (await B.auth.getUser()).data.user?.id
const { data: profBoth } = await createClient(url, anon).from('profiles').select('id,username').in('id', [uidA, uidB].filter(Boolean))
const uA = profBoth?.find(p => p.id === uidA)?.username
const uB = profBoth?.find(p => p.id === uidB)?.username
if (!uidA || !uidB) {
  console.error('Could not establish sessions — aborting.')
  process.exit(1)
}
console.log(`  ids: A=${uidA.slice(0, 8)}… B=${uidB.slice(0, 8)}…`)

// ================================================================
section('PROFILES')
// ================================================================
{
  // profile rows exist (created by handle_new_user trigger at signup)
  const { data: pA, error } = await A.from('profiles').select('username').eq('id', uidA).maybeSingle()
  check('profile readable for A', !error && !!pA?.username, error?.message || pA?.username)

  const uA = pA?.username
  const { data: pB } = await B.from('profiles').select('username').eq('id', uidB).maybeSingle()
  const uB = pB?.username
  check('profile readable for B', !!uB, uB)
  const upA = await A.from('profiles').update({ username: uA, display_name: 'Auditor A' }).eq('id', uidA).select().single()
  check('update own profile A', !upA.error, upA.error?.message)

  // RLS: A must NOT be able to edit B's profile
  const evil = await A.from('profiles').update({ display_name: 'HACKED' }).eq('id', uidB).select()
  check('RLS: cannot edit someone else profile', evil.error !== null || (evil.data ?? []).length === 0)

  const rB = await B.from('profiles').select('username').eq('id', uidB).maybeSingle()
  const upB = await B.from('profiles').update({ username: uB, display_name: 'Auditor B' }).eq('id', uidB).select().single()
  check('update own profile B', !upB.error, upB.error?.message)

  const lookup = await A.from('profiles').select('*').eq('username', uB).maybeSingle()
  check('public profile lookup by username', !lookup.error && lookup.data?.id === uidB, lookup.error?.message)
}

// ================================================================
section('LIBRARY — shelves + progress + goals')
// ================================================================
{
  const add = await A.from('user_library').upsert(
    { user_id: uidA, book_key: 'OL27448W', shelf: 'reading' },   // The Hobbit
    { onConflict: 'user_id,book_key' }
  ).select().single()
  check('add book to shelf', !add.error, add.error?.message)

  const prog = await A.from('user_library').update({ progress_pages: 120 }).eq('user_id', uidA).eq('book_key', 'OL27448W').select().single()
  check('update reading progress', !prog.error && prog.data?.progress_pages === 120, prog.error?.message)

  const move = await A.from('user_library').upsert(
    { user_id: uidA, book_key: 'OL27448W', shelf: 'finished', progress_pages: 300 },
    { onConflict: 'user_id,book_key' }
  ).select().single()
  check('move between shelves (upsert)', !move.error && move.data.shelf === 'finished', move.error?.message)

  const shelf = await A.from('user_library').select('shelf').eq('user_id', uidA).eq('book_key', 'OL27448W').maybeSingle()
  check('get book shelf', shelf.data?.shelf === 'finished')

  const list = await A.from('user_library').select('*').eq('user_id', uidA)
  check('list library', !list.error && list.data.length >= 1)

  // RLS: B cannot see or touch A's library
  const spy = await B.from('user_library').select('*').eq('user_id', uidA)
  check('RLS: library hidden from other users', spy.error || (spy.data ?? []).length === 0, spy.error ? `blocked (${spy.error.message})` : `leaked ${(spy.data ?? []).length} rows`)

  const goal = await A.from('reading_goals').upsert(
    { user_id: uidA, year: new Date().getFullYear(), target: 12 },
    { onConflict: 'user_id,year' }
  ).select().single()
  check('set reading goal', !goal.error, goal.error?.message)
  const goalUpd = await A.from('reading_goals').upsert(
    { user_id: uidA, year: new Date().getFullYear(), target: 20 },
    { onConflict: 'user_id,year' }
  ).select().single()
  check('update reading goal', !goalUpd.error && goalUpd.data.target === 20, goalUpd.error?.message)
}

// ================================================================
section('FOLLOWS (+ follow notification)')
// ================================================================
{
  // clean slate from previous audit runs
  await A.from('user_follows').delete().eq('follower_id', uidA).eq('following_id', uidB)

  const fol = await A.from('user_follows').insert({ follower_id: uidA, following_id: uidB }).select().single()
  check('follow B as A', !fol.error, fol.error?.message)

  const dup = await A.from('user_follows').insert({ follower_id: uidA, following_id: uidB }).select().single()
  check('duplicate follow rejected', dup.error !== null, dup.error?.code === '23505' ? 'unique violation' : dup.error?.message)

  const status = await A.from('user_follows').select('id').eq('follower_id', uidA).eq('following_id', uidB).maybeSingle()
  check('follow status visible to follower', !!status.data)

  // counts
  const cnt = await A.from('user_follows').select('id', { count: 'exact', head: true }).eq('following_id', uidB)
  check('follower count query', cnt.count === 1, `count=${cnt.count}`)

  // notification created by app layer on follow — simulate what profiles.js does
  // EXACTLY: plain insert, no .select() (RETURNING would need SELECT visibility
  // of the recipient's row, which the owner-only SELECT policy rightly blocks).
  // Verify persistence via the recipient's own feed read instead.
  await B.from('notifications').delete().eq('type', 'follow').eq('actor_id', uidA)
  const notif = await A.from('notifications').insert({
    user_id: uidB, type: 'follow', actor_id: uidA,
    message: `${uA} started following you`,
  })
  check('follow notification insert (actor arm of RLS policy)', !notif.error, notif.error?.message)
  const seenByRecipient = await B.from('notifications').select('id').eq('type', 'follow').eq('actor_id', uidA).limit(1)
  check('follow notification persisted for recipient', (seenByRecipient.data ?? []).length === 1)

  // RLS: A cannot insert a notification pretending to be B (actor arm fails)
  const spoof = await A.from('notifications').insert({
    user_id: uidB, type: 'follow', actor_id: uidB, message: 'spoof',
  })
  check('RLS: cannot insert notification as another actor', spoof.error !== null, spoof.error ? 'blocked' : 'INSERTED!')
}

// ================================================================
section('RATINGS & REVIEWS')
// ================================================================
{
  const rate = await A.from('book_ratings').upsert({
    user_id: uidA, book_key: 'OL27448W', rating: 5, review_text: 'Audit review from A',
  }, { onConflict: 'user_id,book_key' }).select().single()
  check('rate book (upsert like reviews.js)', !rate.error, rate.error?.message)

  const uniqKey = `OLAUDIT${stamp % 100000}W`
  const badRating = await A.from('book_ratings').insert({ user_id: uidA, book_key: uniqKey, rating: 6 }).select().single()
  check('rating > 5 rejected by CHECK', badRating.error !== null)

  // two VALID inserts on a fresh key by the same user → unique violation on the second
  await A.from('book_ratings').delete().eq('user_id', uidA).eq('book_key', uniqKey)
  const first = await A.from('book_ratings').insert({ user_id: uidA, book_key: uniqKey, rating: 3 })
  const dupRate = await A.from('book_ratings').insert({ user_id: uidA, book_key: uniqKey, rating: 4 })
  check('first valid rating lands', !first.error, first.error?.message)
  check('second rating same book rejected (unique)', dupRate.error !== null, dupRate.error?.code === '23505' ? '23505' : dupRate.error?.message)

  const upd = await A.from('book_ratings').update({ rating: 4, review_text: 'updated' }).eq('id', rate.data.id).select().single()
  check('author edits own rating', !upd.error && upd.data.rating === 4, upd.error?.message)

  // B reads ratings (public read incl. anon)
  const pubRead = await B.from('book_ratings').select('*').eq('book_key', 'OL27448W')
  check('other users can read ratings', !pubRead.error && pubRead.data.length >= 1)

  // RLS: B cannot edit A's rating
  const evilEdit = await B.from('book_ratings').update({ rating: 1 }).eq('id', rate.data.id).select()
  check('RLS: cannot edit someone else rating', evilEdit.error || (evilEdit.data ?? []).length === 0)

  // avg/count shape used by getBookRating()
  const all = await A.from('book_ratings').select('rating').eq('book_key', 'OL27448W')
  const avg = all.data.reduce((s, r) => s + r.rating, 0) / all.data.length
  check('average computation matches lib logic', Math.abs(avg - 4) < 0.001, `avg=${avg}`)
}

// ================================================================
section('COMMENTS')
// ================================================================
{
  const com = await B.from('book_comments').insert({
    user_id: uidB, book_key: 'OL27448W', body: 'Audit comment from B',
  }).select().single()
  check('post comment', !com.error, com.error?.message)

  // exact join shape CommentSection.jsx uses
  const list = await A.from('book_comments').select('id, body, created_at, user_id, profiles(username)').eq('book_key', 'OL27448W')
  check('read comments with author join', !list.error && list.data.some(c => c.profiles?.username === uB), list.error?.message)

  const del = await B.from('book_comments').delete().eq('id', com.data.id)
  check('author deletes own comment', !del.error, del.error?.message)
}

// ================================================================
section('GLOBAL CHAT')
// ================================================================
{
  // column is `message` (0007), and the UI fetches profiles client-side —
  // but the join should work since user_id references auth.users not profiles.
  // Test BOTH: raw select (what chat.js does) then try the join.
  const msg = await A.from('global_chat_messages').insert({ user_id: uidA, message: 'audit hello global' }).select().single()
  check('send global message', !msg.error, msg.error?.message)

  const feed = await B.from('global_chat_messages').select('id, user_id, message, created_at').order('created_at', { ascending: false }).limit(10)
  check('other user reads global feed', !feed.error && feed.data.some(m => m.message === 'audit hello global'), feed.error?.message)

  // how GlobalChat.jsx resolves usernames for display
  const { data: gProfiles } = await B.from('profiles').select('username').in('id', [uidA])
  check('global chat username resolution', (gProfiles ?? []).some(p => p.username === uA))

  if (msg.error) {
    check('RLS: cannot delete others global message', true, 'skipped — send failed')
  } else {
    const evilDel = await B.from('global_chat_messages').delete().eq('id', msg.data.id).select()
    check('RLS: cannot delete others global message', evilDel.error || (evilDel.data ?? []).length === 0)
  }
}

// ================================================================
section('PRIVATE CHAT + READ RECEIPTS')
// ================================================================
{
  // Production flow uses the SECURITY DEFINER rpc create_dm_channel(other_user)
  // (added during the audit — direct insert path is impossible under correct RLS:
  // creator can't insert the OTHER user's participant row).
  const dm = await A.rpc('create_dm_channel', { other_user: uidB })
  check('create/reuse DM channel via rpc', !dm.error && !!dm.data, dm.error?.message)
  const channelId = dm.data

  const mineParts = await A.from('chat_participants').select('user_id').eq('channel_id', channelId)
  // RLS: each user sees only their OWN participant row (user_id = auth.uid()).
  // Both rows exist — proven by send/read/receipt below (messages_insert requires
  // the recipient's row via EXISTS). Here we assert kingu sees exactly his one.
  check('own participant row visible', (mineParts.data ?? []).length === 1 && mineParts.data[0].user_id === uidA, `got ${(mineParts.data ?? []).length}`)

  const m1 = await A.from('private_messages').insert({ channel_id: channelId, sender_id: uidA, message: 'ping from A' }).select().single()
  check('send private message', !m1.error, m1.error?.message)

  const inbox = await B.from('private_messages').select('*').eq('channel_id', channelId)
  check('recipient reads thread', !inbox.error && inbox.data.some(m => m.message === 'ping from A'), inbox.error?.message)

  // read receipt: recipient marks messages read (same update PrivateChat uses)
  const receipt = await B.from('private_messages').update({ read_at: new Date().toISOString() })
    .eq('channel_id', channelId).neq('sender_id', uidB).is('read_at', null).select()
  check('mark received messages read', !receipt.error && (receipt.data ?? []).length >= 1, receipt.error?.message)

  const seenBySender = await A.from('private_messages').select('read_at').eq('channel_id', channelId).eq('sender_id', uidA)
  check('sender observes read receipt', (seenBySender.data ?? []).length >= 1 && seenBySender.data.every(m => m.read_at !== null))

  // RLS: signed-out outsider cannot see anything
  const C = createClient(url, anon)
  const sneakCh = await C.from('chat_channels').select('*').eq('id', channelId).maybeSingle()
  check('RLS: signed-out cannot read DM channel', sneakCh.error || sneakCh.data === null, sneakCh.data ? 'READ IT!' : 'blocked/null')
  const sneakP = await C.from('chat_participants').select('*').eq('channel_id', channelId)
  check('RLS: signed-out cannot read participants', sneakP.error || (sneakP.data ?? []).length === 0, sneakP.error ? 'blocked' : `leaked ${(sneakP.data ?? []).length}`)
  const sneakM = await C.from('private_messages').select('*').eq('channel_id', channelId)
  check('RLS: signed-out cannot read DM messages', sneakM.error || (sneakM.data ?? []).length === 0, sneakM.error ? 'blocked' : `leaked ${(sneakM.data ?? []).length}`)

  // RLS: a third authenticated user who is NOT a participant — use anon-signed-out is not enough;
  // but we only have two users. Skip. Instead verify B cannot write into A's sender slot:
  const forge = await B.from('private_messages').insert({ channel_id: channelId, sender_id: uidA, message: 'forged as kingu' }).select().single()
  check('RLS: B cannot forge message as A', forge.error !== null, forge.error ? 'blocked' : 'FORGED!')
}

// ================================================================
section('BOOK CLUBS')
// ================================================================
{
  const club = await A.from('book_clubs').insert({
    name: `Audit Club ${stamp}`, description: 'temp audit club', created_by: uidA,
  }).select().single()
  check('create club', !club.error, club.error?.message)
  const clubId = club.data?.id

  const mem = await A.from('club_members').insert({ club_id: clubId, user_id: uidA, role: 'owner' }).select().single()
  check('creator joins as admin', !mem.error, mem.error?.message)

  const joinB = await B.from('club_members').insert({ club_id: clubId, user_id: uidB, role: 'member' }).select().single()
  check('B joins club', !joinB.error, joinB.error?.message)

  const roster = await B.from('club_members').select('*, profiles(username)').eq('club_id', clubId)
  check('member list readable by members', !roster.error && roster.data.length === 2, roster.error?.message)

  const disc = await B.from('club_discussions').insert({
    club_id: clubId, user_id: uidB, title: 'Audit topic', body: 'first post',
  }).select().single()
  check('B posts discussion', !disc.error, disc.error?.message)

  // discussion notifications fan-out (exactly as clubs.js does — plain insert, no returning;
  // verify via recipient's feed)
  const recipients = [uidA] // members minus author
  const fanout = await B.from('notifications').insert(recipients.map(userId => ({
    user_id: userId, type: 'club_discussion', actor_id: uidB, club_id: clubId,
    message: `${uB} posted in ${club.data.name}: Audit topic`,
  })))
  const seenFanout = !fanout.error
    ? (await A.from('notifications').select('id').eq('type', 'club_discussion').eq('actor_id', uidB).limit(1)).data
    : null
  check('discussion notification fan-out', !fanout.error && (seenFanout ?? []).length === 1,
    fanout.error?.message || ((seenFanout ?? []).length === 1 ? 'recipient sees it' : 'not persisted'))
}

// ================================================================
section('NOTIFICATIONS — read paths + realtime')
// ================================================================
{
  // seed a fresh unread notification so feed checks are deterministic
  // (earlier audit runs marked everything read)
  const seed = await A.from('notifications').insert({
    user_id: uidB, type: 'follow', actor_id: uidA, message: `audit seed ${stamp}`,
  })
  check('seed fresh notification', !seed.error, seed.error?.message)

  const feed = await B.from('notifications').select('*, profiles!notifications_actor_id_fkey(username)').eq('user_id', uidB).order('created_at', { ascending: false })
  check('B reads own feed with actor username', !feed.error && feed.data.length >= 1 && feed.data[0].profiles?.username === uA, feed.error?.message || `got ${feed.data?.length}`)

  const unread = await B.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', uidB).eq('read', false)
  check('unread count query', unread.count >= 1, `count=${unread.count}`)

  const markOne = await B.from('notifications').update({ read: true }).eq('id', feed.data[0].id).select().single()
  check('mark one as read', !markOne.error && markOne.data.read === true, markOne.error?.message)

  const markAll = await B.from('notifications').update({ read: true }).eq('user_id', uidB).eq('read', false).select()
  check('mark all read', !markAll.error && (markAll.data ?? []).length >= 1, markAll.error?.message)

  // A cannot read B's notifications
  const steal = await A.from('notifications').select('*').eq('user_id', uidB)
  check('RLS: notifications private to owner', steal.error || (steal.data ?? []).length === 0,
    steal.error ? 'blocked' : ((steal.data ?? []).length === 0 ? '0 rows (correct)' : `LEAKED ${(steal.data).length} rows`))

  // realtime INSERT delivery — wait for SUBSCRIBED before firing the insert,
  // and allow enough time for websocket round-trip
  const gotRealtime = await new Promise(resolve => {
    // fresh client — earlier sections may have removed channels on B, and
    // supabase-js reuses the underlying realtime connection state
    const RT = createClient(url, anon)
    RT.auth.signInWithPassword({ email: emailB, password: pwB }).then(() => {
    let delivered = null
    let fired = false
    const ch = RT.channel(`audit:${stamp}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uidB}` },
        payload => { console.log("  [rt] DELIVERED:", payload.new?.message); delivered = payload.new?.message; resolve(delivered) })
      .subscribe(state => {
        // fire only after SUBSCRIBED *and* give realtime 1.5s to settle the
        // server-side subscription before the insert lands
        if (console.log("  [rt] sub state:", state), state === "SUBSCRIBED" && !fired) {
          fired = true
          setTimeout(() => {
            console.log('  [rt] firing insert now')
            A.from('notifications').insert({
              user_id: uidB, type: 'follow', actor_id: uidA, message: `realtime ping ${stamp}`,
            }).then(r => console.log('  [rt] insert result:', r.error?.message ?? 'ok'))
          }, 1500)
        }
      })
    setTimeout(() => resolve(null), 15000)
    setTimeout(() => { if (delivered === null) RT.removeChannel(ch) }, 15500)
    })
  })
  check('realtime INSERT delivered to recipient', gotRealtime !== null, gotRealtime || 'timeout 15s — is the table in supabase_realtime publication?')
}

// ================================================================
section('OPENLIBRARY / GOOGLE BOOKS APIs')
// ================================================================
{
  try {
    const res = await fetch('https://openlibrary.org/search.json?q=hobbit&limit=2&fields=key,title,author_name,cover_i,first_publish_year')
    const json = await res.json()
    check('OpenLibrary search API', res.ok && Array.isArray(json.docs) && json.docs.length > 0, `${json.docs?.length} docs`)
    const cover = json.docs.find(d => d.cover_i)?.cover_i
    if (cover) {
      const cRes = await fetch(`https://covers.openlibrary.org/b/id/${cover}-M.jpg`, { method: 'HEAD' })
      check('OpenLibrary covers API', cRes.ok, `status ${cRes.status}`)
    }
  } catch (e) { check('OpenLibrary search API', false, e.message) }

  try {
    const res = await fetch('https://www.googleapis.com/books/v1/volumes?q=hobbit&maxResults=2')
    const json = await res.json()
    // 429 = transient per-IP rate limit; treat as warning, not feature failure
    if (res.status === 429) {
      check('Google Books API', true, 'rate-limited (429) — transient, API reachable')
    } else {
      check('Google Books API', res.ok && (json.items?.length ?? 0) > 0, `status ${res.status}, items ${json.items?.length ?? 0}`)
    }
  } catch (e) { check('Google Books API', false, e.message) }
}

// ================================================================
console.log(`\n====================\nRESULT: ${passCount} passed, ${failCount} failed\n====================`)
process.exit(failCount > 0 ? 1 : 0)
