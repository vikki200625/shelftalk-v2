# ShellTalk

A community app for readers. Discover books, track what you read, and connect with other people over books.

## Vision (vague on purpose)

The app is a place where a reader can:
- Search and discover books (Google Books + OpenLibrary data)
- Keep a personal library: want to read / reading / finished, with reading progress and goals
- See book details, ratings, and metadata
- Connect with other readers — friends, notes, discussions, book clubs
- Slowly evolve into a social experience as features are added

Exact features are NOT fixed. The user will add new ones over time. This file is just the direction — never assume a feature list is complete or final.

## Stack

- React + Vite (JavaScript, not TypeScript unless the user says otherwise)
- Supabase: auth, PostgreSQL database, RLS policies
- Google Books API + OpenLibrary API for book data

## Non-negotiable architecture rules

These exist because the previous version of this project became unmaintainable (every change caused cascading errors). They are NOT suggestions:

1. **One centralized theme system.** Colors, fonts, spacing live in CSS variables / design tokens in ONE place. Never hardcode colors per-page, never patch styles page-by-page.
2. **Vertical slices, one at a time.** Build one complete mini-feature (page → data → working UI) before starting the next. Do not scaffold many pages up front.
3. **Tests with every slice.** Each feature gets tested before moving on (Vitest + React Testing Library). A feature is not "done" until its tests pass.
4. **Shared components, not copy-paste.** Anything used in more than one place becomes a component with props. No duplicated page code.
5. **Small, frequent git commits.** Commit after every working slice. Never commit a broken state.

## Where the old code lives

The previous (messy but valuable) version is at /home/vikki/shelftalk. It contains working SQL migrations, RLS policies, and API integration quirks. Use it as a REFERENCE for how things worked — do not copy its architecture, do not bring its problems over.

## Working style

- Slow and steady beats fast and broken.
- When in doubt, ask the user rather than inventing features.
- Keep responses and code simple — this is a learning project, not a production system.

## Two agents, one project (Hermes + OpenClaude)

This project is worked on by two AI agents: **Hermes** (CLI agent) and **OpenClaude** (opencode agent). They share the repo but not the conversation, so coordination lives in files:

- `WORKLOG.md` — shared status. Read it before starting any task, add an entry when you start, move it to Done when you finish. Never edit the other agent's entries.
- `AGENTS.md` — the coordination rules both agents auto-read (this is a pointer, the brief stays in this file).
- Git history — `git log` shows what the other agent did; commit after every slice.

If the other agent's in-progress work overlaps yours, stop and ask the user before proceeding.
