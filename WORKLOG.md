# ShellTalk WORKLOG

Shared status file between the two agents working on this project:

- **Hermes** — the CLI agent (runs in terminal, has memory of the old repo)
- **OpenClaude** — the opencode agent (runs in its own sessions)

## Rules (both agents MUST follow)

1. Read this file BEFORE starting any task.
2. When you start a task: add an entry under **In progress** (agent name, what you're doing, which files).
3. When you finish: move it to **Done**, add the date, and commit your changes.
4. NEVER edit or delete another agent's entry — add your own.
5. If the other agent has a task **In progress** that overlaps yours: STOP and check with the user, or pick a different slice.
6. The git log is also shared state — `git log --oneline -10` shows what the other agent did. Commit after every working slice (already a PROJECT.md rule).
7. Destructive commands on shared paths (`rm -rf`, `git reset --hard`, renames) only after telling the user what you're doing.

## Suggested ownership split (editable — user can change this)

- **Hermes**: app code in the Vite project (components, styles, tests), Supabase schema, architecture rules
- **OpenClaude**: design iteration, Stitch prompts, visual polish, new UI experiments

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

## In progress

- **Hermes (2026-08-01)**: Profiles slice — public profile page + edit profile. Plan:
  1. `/profile/:username` — public view: display name, avatar, bio, member since, shelf counts
  2. `/settings` — edit own profile: display name, avatar URL, bio
  3. Follow/unfollow button on other users' profiles (uses `user_follows` table)
  4. Tests for all above
  Files: `src/pages/Profile.jsx` (new), `src/pages/Settings.jsx` (new), `src/components/ProfileHeader.jsx` (new), `src/components/FollowButton.jsx` (new), `src/App.jsx`, `src/styles/globals.css`, tests.

## Up next

- **Hermes**: library slice — user shelves (want_to_read / reading / finished), progress tracking, reading goals.
- **OpenClaude**: "See all" index pages for genres/trending; or library UI slice.

---

## How to add an entry

```markdown
- **YYYY-MM-DD — <Agent name>**: <what you did / are doing>. Files: <paths>.
```
