# Glassflow Expense Tracker

Track spending with intention. A personal finance workspace for budgets, expenses, and team
insights — built with React 19, Redux Toolkit, and shadcn/ui.

> **Tagline:** Spend with intention.

## Features

- **Budgets** — set monthly budgets, track spend against them, and drill into category detail
- **Expenses** — log, filter, and review transactions with a polished list view
- **Overview** — dynamic daily spend breakdown with local date helpers
- **Auth** — login, signup, email verification, password reset, and invite acceptance
- **Multi-profile** — admin and member roles with permission-aware routing
- **Theme support** — light, dark, and system modes applied before first paint
- **Offline-first feel** — route metadata auto-discovered from page modules; page chunks
  pre-warmed on idle for snappy first navigation

## Tech Stack

| Layer            | Choice                                              |
| ---------------- | --------------------------------------------------- |
| Build            | Vite 8 (ESNext target, `@tailwindcss/vite`)         |
| UI library       | React 19, React DOM 19, React Router 7              |
| State            | Redux Toolkit + React Redux                         |
| Styling          | Tailwind CSS 4, shadcn/ui (new-york style)          |
| Charts           | Recharts, react-apexcharts                          |
| Animations       | framer-motion, embla-carousel                       |
| Notifications    | sonner                                             |
| Auth SDK        | Apper (CDN-loaded)                                  |
| Icons           | lucide-react                                        |

## Project Structure

```
src/
├── App.jsx                 # Root providers (theme, tooltips, router, toaster)
├── main.jsx                # Entry: Redux store + createRoot render
├── config/
│   └── app.config.js       # App metadata + auth profiles
├── store/                  # Redux store + user slice
├── router/                 # Auto-discovered routes + frozen auth routes
├── layouts/                # Root / Owner (signed-in) / Public (auth) shells
├── pages/                  # Home, Budgets, Expenses, auth pages, 404
├── components/             # App shell + shadcn/ui component library
├── services/               # SDK wrapper, permissions, mock data
├── contexts/               # Theme context
├── hooks/                  # useFetch, useFunction, useProfile, useIsMobile...
└── utils/                  # date.js — local date/month helpers
```

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
```

### Environment

The app reads runtime configuration from environment variables (Apper credentials and SDK
URL). Create a `.env` locally — **never commit secrets**:

```env
VITE_APPER_PROJECT_ID=...
VITE_APPER_PUBLIC_KEY=...
VITE_APPER_SDK_CDN_URL=https://cdn.apper.io/v1/apper-sdk.v1.js
```

`.env`, `.env.local`, and `*.local` variants are already git-ignored.

## Running the App

The dev server serves the app from `src/` with `@` aliased to `./src`. Open the local URL
printed by Vite after `npm run dev`.

## Deployment

Build output lands in `dist/` (git-ignored). Serve it with any static host — the app is
self-contained at build time; the only runtime requirement is the Apper SDK CDN URL from
your environment.

## Commit Conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature
- `fix:` — bug fix
- `chore:` — maintenance / config

## License

Proprietary — see the repository owner for licensing terms.