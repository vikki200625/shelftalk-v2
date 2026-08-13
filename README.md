# shelftalk

> A social platform for book lovers — discover books, build your shelf, follow readers, and chat.

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white"/>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white"/>
  <img alt="Tests" src="https://img.shields.io/badge/Vitest-729B1B?style=for-the-badge&logo=vitest&logoColor=white"/>
</p>

## Overview

**shelftalk** is a full-stack social book-discovery web app. Users sign up, build a
personal reading library, set reading goals, follow other readers, browse and review
books (powered by the **Open Library** API), and talk in global and private chats.
Built with **React + Vite** and a **Supabase** backend, with a polished animated landing
experience.

## Features

### Discovery
- Browse books by genre (`GenreBento`, `GenreSection`, `Trending`)
- Search with `SearchBar`
- Book detail pages (`BookDetail`, `BookCover`, `BookCard`) powered by Open Library

### Social
- Auth — email sign-up / sign-in, password reset
- Public profiles + follow system (`FollowButton`, `UserCard`, `FindFriends`)
- Global chat + private 1:1 chat
- Comments on books

### Personal
- Personal library / shelf (`Library`, `ShelfSection`)
- Reading-goals tracker (`ReadingGoal`)

### Experience
- Animated landing (`Hero`, `FloatingBooks`, `FadeIn`, `CtaBand`)
- Responsive `Navbar` / `Footer`, `ScrollToTop`

## Tech Stack

| Layer    | Choice                                  |
|----------|-----------------------------------------|
| UI       | React 18 + TypeScript                   |
| Build    | Vite (+ Vitest for tests)               |
| Routing  | React Router                            |
| Backend  | Supabase (Postgres + Auth)              |
| Book data| Open Library API                        |
| Styling  | Tailwind CSS                            |

## Database (Supabase migrations)
- `0001` profiles & books
- `0002` user_library
- `0003` reading_goals
- `0004` user_follows
- `0005` username_not_null
- `0006` book_comments
- `0007` global_chat_messages
- `0008` private_chat

## Architecture
```
src/
  pages/      Browse, Library, Profile, GlobalChat, PrivateChat,
              SignIn/Up, Settings, FindFriends, Forgot/ResetPassword ...
  components/ Auth, BookCard, Chat, FollowButton, Hero, Navbar, ...
  context/    AuthContext
  lib/        supabase, openlibrary, chat, library, profiles, validate
  styles/     globals.css, tokens.css
supabase/migrations/   SQL schema (0001–0008)
```

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project

### Install
```bash
git clone https://github.com/vikki200625/shelftalk-v2.git
cd shelftalk-v2
npm install
```

### Environment
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Run
```bash
npm run dev       # dev server
npm run build     # production build
npm run preview   # preview build
npm run test      # Vitest
```

## Status
Actively developed — core social + discovery flows implemented with tests.

<p align="center"><sub>Built with React · Vite · Supabase · Tailwind</sub></p>
