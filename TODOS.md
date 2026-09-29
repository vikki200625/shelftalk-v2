# TODOS

Design and product debt tracked across sessions. Newest first; add context so a
reader in three months understands the why without re-deriving it.

## 2026-09-29 — Post-signup onboarding hint (design review)

- **What:** A single dismissible first-run hint for newly signed-up users pointing
  at Library and Find Friends (the social half of the app is never surfaced).
- **Why:** After signup the journey recovers only via the library empty-state CTA;
  newcomers never discover clubs/chat/friends on their own.
- **Pros:** Surfaces the app's differentiating features; small component; follows
  existing test patterns.
- **Cons:** Minor UI churn; needs a dismiss-persisted flag (localStorage is fine).
- **Context:** From the 2026-09-29 whole-app design review, Pass 3 (journey).
  The empty-library CTA covers the critical path, so this is enhancement debt,
  not a blocker. Chosen as TODO over "build now" to keep P1 fix-week priority.
- **Depends on / blocked by:** Nothing.
