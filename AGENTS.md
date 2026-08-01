# AGENTS.md — ShellTalk coordination rules

This file is auto-read by BOTH agents (Hermes and OpenClaude/opencode).

## Before starting ANY task

1. Read `WORKLOG.md` — it is the shared status file.
2. Read `PROJECT.md` — the project brief and non-negotiable architecture rules.
3. Check `git log --oneline -10` to see the other agent's latest commits.
4. If the other agent has an **In progress** entry that overlaps your task, STOP and ask the user.

## While working

- Never edit the other agent's WORKLOG entries — add your own.
- Never hardcode colors/fonts — everything goes through `src/styles/tokens.css`.
- Tests must pass before you say something is done (`npm test`).
- Commit after every working slice with a clear message.

## After finishing

- Add a **Done** entry to `WORKLOG.md` with the date and files touched.
- Commit the WORKLOG update with your changes.

## Project files at a glance

- `PROJECT.md` — vision + architecture rules (authoritative)
- `WORKLOG.md` — shared status between agents (read first, update after)
- `src/` — the Vite + React app (the real landing page and future slices)
- `code.html`, `screen.png`, `DESIGN.md` — old Stitch static export, reference only
- `/home/vikki/shelftalk` — OLD repo (v1), reference only, do not modify
