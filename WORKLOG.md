# ShelfTalk WORKLOG

Shared status file between all agents working on this project:

- **Hermes-Backend** — Bot Mode: handles Supabase schema, migrations, data layer
- **Hermes-Frontend** — Bot Mode: handles React components, pages, styling
- **Hermes-QA** — Bot Mode: runs tests, reviews code, catches bugs

## Rules (all agents MUST follow)

1. Read this file BEFORE starting any task.
2. When you start a task: add an entry under **In progress** (agent name, what you're doing, which files).
3. When you finish: move it to **Done**, add the date, and commit your changes.
4. NEVER edit or delete another agent's entry — add your own.
5. If another agent has a task **In progress** that overlaps yours: STOP and check with the user, or pick a different slice.
6. The git log is also shared state — `git log --oneline -10` shows what the other agent did. Commit after every working slice (already a PROJECT.md rule).
7. Destructive commands on shared paths (`rm -rf`, `git reset --hard`, renames) only after telling the user what you're doing.

## Ownership split

- **Hermes-Backend**: Supabase migrations, src/lib/*.js, database schema, API integration
- **Hermes-Frontend**: src/components/, src/pages/, src/App.jsx, src/styles/
- **Hermes-QA**: npm test, code review, build verification, test coverage

---

## Done

- **2026-08-01 — Hermes**: Fresh Supabase schema for the rebuild: `supabase/migrations/0001-0004` (profiles + books catalog, user_library, reading_goals, user_follows) with real per-user RLS, `books.ol_key` as PK, shared updated_at trigger, auto-profile-on-signup. Ported concepts from old repo's migrations but fixed its problems (RLS bypass, DROP TABLE CASCADE, drifting goal counters, missing delete policies). Deliberately scoped to next slices only — clubs/chat/analytics deferred until their features are built. Applied via Supabase dashboard SQL editor (no CLI on this machine). Files: `supabase/migrations/*.sql`, `supabase/README.md`.
- **2026-08-01 — Hermes**: Reviewed OpenClaude's book discovery slice (5 commits: API layer, live search, real trending, genre shelves, token fix) — verified live in browser, 39/39 tests green. Fixed: hero quick links (Dune/The Alchemist/Atomic Habits) were dead `href="#"` — now trigger a real search via controlled query state in `Hero.jsx` + `SearchBar.jsx`; removed circular "See all →" self-links in Trending/GenreSection; added full keyboard nav to search dropdown (ArrowUp/Down/Home/End, aria-activedescendant, proper combobox role); lazy-loaded genre rows via IntersectionObserver (was firing 6 API calls on page load, now fetches on scroll, rootMargin 200px); tokenized last hardcoded `#fff`; spine fallbacks now cycle per-book colors (was all green). Added 3 new tests (keyboard nav, controlled query wiring, quick-link search). Tests: 39/39, build green. Files: `src/components/Hero.jsx`, `src/components/SearchBar.jsx`, `src/components/GenreSection.jsx`, `src/components/BookCover.jsx`, `src/components/Trending.jsx`, `src/styles/globals.css`, tests.
- **2026-08-01 — Hermes**: Landing page completed in the Vite app. All 7 sections (Navbar, Hero, Trending, Features, Testimonials, CTA band, Footer) as components, no blue/slate anywhere, centralized design tokens in `src/styles/tokens.css`, hamburger menu for mobile, reduced-motion support. Tests: 7/7 passing (`npm test`), build green (`npm run build`). Verified live in browser. Files: `src/App.jsx`, `src/components/*`, `src/styles/*`, `src/App.test.jsx`, `src/test/setup.js`.
- **2026-08-01 — OpenClaude**: Vite project scaffolded in this folder (src/, package.json, vite.config.js) with initial components (Navbar, Hero, SearchBar, FloatingBooks, FadeIn), tokens.css/globals.css, and App.test.jsx with 5 tests. `code.html` at project root is the older static Stitch export — superseded by the Vite app, keep as reference only.
- **2026-08-01 — OpenClaude**: Book detail page slice (react-router v8, first dependency). Router shell: BrowserRouter in main.jsx, App routes `/` → Landing and `/book/:key` → BookDetail, ScrollToTop (instant scroll, smooth-CSS gotcha), Navbar logo → Link. Detail page: instant header from router state (title/author/year/rating/cover) + fetchWork() upgrades with description (string-or-{value} normalized), first 6 subject tags, large cover (skips -1), one-hop work redirects, error+retry, deep links. Click wiring: BookCard → Link, SearchBar rows click + Enter → navigate (keyboard-nav tests untouched). 54 tests green, build clean. Files: `src/main.jsx`, `src/App.jsx`, `src/components/Landing.jsx` (new), `src/components/ScrollToTop.jsx` (new), `src/components/BookDetail.jsx` (new), `src/components/BookCard.jsx`, `src/components/SearchBar.jsx`, `src/components/Navbar.jsx`, `src/components/BookCover.jsx`, `src/lib/openlibrary.js`, `src/styles/globals.css`, tests.
- **2026-08-01 — Hermes**: Auth slice v1 — basic email/password sign-in/sign-up. Created Supabase client, AuthContext, SignIn/SignUp pages, ProtectedRoute, auth-aware Navbar. Removed Features + Testimonials sections, Community navbar link now redirects to /signup. Tests: 63/63 green, build clean. Files: `src/lib/supabase.js`, `src/context/AuthContext.jsx`, `src/pages/SignIn.jsx`, `src/pages/SignUp.jsx`, `src/components/ProtectedRoute.jsx`, `src/components/Auth.test.jsx`, `src/App.jsx`, `src/components/Navbar.jsx`, `src/styles/globals.css`, `.env`.
- **2026-08-01 — Hermes**: Auth slice v2 — full auth flow overhaul. Username-based login, password validation (8+ chars, 1+ number, 1+ special), forgot password flow (username → email reset link), reset password page. New migration 0005 (username NOT NULL, email column in profiles, updated trigger). Tests: 80/80 green, build clean. Files: `supabase/migrations/0005_username_not_null.sql`, `src/pages/SignUp.jsx`, `src/pages/SignIn.jsx`, `src/pages/ForgotPassword.jsx`, `src/pages/ResetPassword.jsx`, `src/context/AuthContext.jsx`, `src/components/Auth.test.jsx`, `src/App.jsx`, `src/styles/globals.css`, `src/lib/validate.js`.
- **2026-08-01 — OpenClaude**: Book comments slice — `book_comments` table (migration 0006, RLS: everyone reads, only signed-in users write as themselves, authors edit/delete their own). `CommentSection` at the end of `/book/:key`: comment list (username + date + body), sign-in prompt for visitors, post form for authenticated users that refetches after posting. Tests mock the supabase module (thenable chain mirroring the real client). 87/87 green, build clean. Files: `supabase/migrations/0006_book_comments.sql`, `src/components/CommentSection.jsx` + `CommentSection.test.jsx`, `src/components/BookDetail.jsx` + `BookDetail.test.jsx`, `src/styles/globals.css`.
 - **2026-08-02 — Hermes**: Find Friends page — `/find-friends` route with search users by username, suggested profiles section, follower/following lists with counts. `UserCard` component (avatar, name, username, bio, follow button). Data layer: `searchProfiles`, `fetchSuggestedProfiles`, `fetchFollowers`, `fetchFollowing` functions in `profiles.js`. Navbar updated with "Find Friends" link. 6 tests, 111/111 total green, build clean. Files: `src/pages/FindFriends.jsx`, `src/components/UserCard.jsx`, `src/components/FindFriends.test.jsx`, `src/lib/profiles.js`, `src/App.jsx`, `src/components/Navbar.jsx`, `src/styles/globals.css`.
  - **2026-08-02 — Hermes**: Library slice — `/library` route with three shelves (Currently Reading, Want to Read, Finished), reading goal tracker with progress bar, remove from shelf. `ShelfSection` component with expand/collapse, `ReadingGoal` component with set/edit goal. Data layer: `addToShelf`, `removeFromShelf`, `getShelfBooks`, `getReadingGoal`, `setReadingGoal`, `getBooksFinishedCount` in `library.js`. Navbar Library link updated to route. 5 tests, 116/116 total green, build clean. Files: `src/pages/Library.jsx`, `src/components/ShelfSection.jsx`, `src/components/ReadingGoal.jsx`, `src/components/Library.test.jsx`, `src/lib/library.js`, `src/App.jsx`, `src/components/Navbar.jsx`, `src/styles/globals.css`.
   **2026-08-02 — Hermes**: Chat slice — global chat (`/chat`) + private messages (`/messages`). Real-time subscriptions via Supabase Realtime. Global chat: public room with message history, timestamps, user avatars. Private chat: conversation list with last message preview, unread badges, individual chat view with read receipts (✓ sent, ✓✓ read). Data layer: `sendGlobalMessage`, `getGlobalMessages`, `subscribeGlobalMessages`, `getUserChannels`, `getChannelMessages`, `sendPrivateMessage`, `markAsRead`, `subscribePrivateMessages`, `subscribeReadReceipts`, `getOrCreateChannel` in `chat.js`. Migrations 0007 + 0008. 4 tests, 124/124 total green, build clean. Files: `src/pages/GlobalChat.jsx`, `src/pages/PrivateChat.jsx`, `src/components/Chat.test.jsx`, `src/lib/chat.js`, `supabase/migrations/0007_global_chat_messages.sql`, `supabase/migrations/0008_private_chat.sql`, `src/App.jsx`, `src/components/Navbar.jsx`, `src/styles/globals.css`.
- **2026-08-02 — OpenClaude**: Fixed profile link — Navbar "View profile" now uses the real username from the `profiles` table (added `profile` to AuthContext on login). Files: `src/context/AuthContext.jsx`, `src/components/Navbar.jsx`.
- **2026-08-02 — OpenClaude**: Browse page slice — `/browse` route from `stitch_export/code.html`. Hero search (eyebrow, italic headline, pill input) + genre chips; search-results grid with "Load more" (paged via `searchBooksPage`); "Explore by Genre" bento with real OpenLibrary book counts (`fetchSubjectCount`); "Your Shelves Are Bare" empty state (CTA → signup or own profile). Navbar "Browse" → `/browse`. Note: core browse files were swept into Hermes's library commit (6b873ec) while uncommitted in the shared tree; the tests, browse styles, and a profile-CTA guard followed in OpenClaude's own commit. 4 new tests, 120/120 green, build clean. Files: `src/pages/Browse.jsx` (new), `src/components/GenreBento.jsx` (new), `src/pages/Browse.test.jsx` (new), `src/lib/openlibrary.js`, `src/App.jsx`, `src/components/Navbar.jsx`, `src/styles/globals.css`.
- **2026-08-02 — OpenClaude**: Browse verification follow-up — per verifier findings: added `--brand-accent-soft` token (replaces the hardcoded rgba in the load-more hover), defined the `bento--forest/brass/sage` tone classes (were referenced but undefined — cards now show distinct accent bars), moved `aria-live` onto the results header so "load more" appends don't re-announce the whole grid. Independent verifier verdict: PASS. 124/124 green, build clean. Files: `src/styles/tokens.css`, `src/styles/globals.css`, `src/pages/Browse.jsx`.
- **2026-08-21 — Hermes-Backend**: Book clubs migration 0009 — three tables (`book_clubs`, `club_members`, `club_discussions`) with full RLS. Clubs are publicly browsable, only signed-in users can create. Members join/leave with role tracking (owner/member). Discussions are member-only with author edit/delete. Matches the API contract in `src/lib/clubs.js`. 221/221 tests green, build clean. Files: `supabase/migrations/0009_book_clubs.sql`.

## Done

- **2026-08-21 — Hermes-Backend**: Book clubs feature — migration 0009 (book_clubs, club_members, club_discussions tables + RLS). Applied via Supabase dashboard SQL editor. 221/221 green, build clean. Files: `supabase/migrations/0009_book_clubs.sql`.

- **2026-08-21 — Hermes-Frontend**: Book clubs UI slice — /clubs (browse/search), /clubs/:id (detail, members, discussions, join/leave), /clubs/new (create form). Components: ClubCard, DiscussionCard, DiscussionForm. Data layer in src/lib/clubs.js wired to real Supabase queries (matches migration 0009 schema). Navbar "Book Clubs" now routes to /clubs. 9 tests, 221/221 total green, build clean. All colors from tokens.css. Files: `src/pages/Clubs.jsx`, `src/pages/ClubDetail.jsx`, `src/pages/CreateClub.jsx`, `src/components/ClubCard.jsx`, `src/components/DiscussionCard.jsx`, `src/components/DiscussionForm.jsx`, `src/lib/clubs.js`, `src/components/Clubs.test.jsx`, `src/App.jsx`, `src/components/Navbar.jsx`, `src/styles/globals.css`.

## In progress

## Up next

- **Hermes-QA**: Verify book clubs tests after each slice

---

## How to add an entry

```markdown
- **YYYY-MM-DD — <Agent name>**: <what you did / are doing>. Files: <paths>.
```
