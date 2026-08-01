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
6. The git log is also shared state — `git log --oneline -10` shows what the other agent did. Commit after every slice (already a PROJECT.md rule).
7. Destructive commands on shared paths (`rm -rf`, `git reset --hard`, renames) only after telling the user what you're doing.

## Suggested ownership split (editable — user can change this)

- **Hermes**: app code in the Vite project (components, styles, tests), Supabase schema, architecture rules
- **OpenClaude**: design iteration, Stitch prompts, visual polish, new UI experiments

---

## Done

- **2026-08-01 — Hermes**: Landing page completed in the Vite app. All 7 sections (Navbar, Hero, Trending, Features, Testimonials, CTA band, Footer) as components, no blue/slate anywhere, centralized design tokens in `src/styles/tokens.css`, hamburger menu for mobile, reduced-motion support. Tests: 7/7 passing (`npm test`), build green (`npm run build`). Verified live in browser. Files: `src/App.jsx`, `src/components/*`, `src/styles/*`, `src/App.test.jsx`, `src/test/setup.js`.
- **2026-08-01 — OpenClaude**: Vite project scaffolded in this folder (src/, package.json, vite.config.js) with initial components (Navbar, Hero, SearchBar, FloatingBooks, FadeIn), tokens.css/globals.css, and App.test.jsx with 5 tests. `code.html` at project root is the older static Stitch export — superseded by the Vite app, keep as reference only.

## In progress

- *(nothing right now)*

---

## How to add an entry

```markdown
- **YYYY-MM-DD — <Agent name>**: <what you did / are doing>. Files: <paths>.
```
