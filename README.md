# W.A.Y. Full-Stack MVP

W.A.Y. means **Who Are You**. It is a Russian-first career guidance and self-discovery platform for school students with a polished React frontend and a production-style Node.js API.

The MVP now includes real authentication, PostgreSQL persistence, Prisma migrations, saved professions, test attempts/results, W.A.Y. Guide conversations, an admin dashboard, and backend-only Groq integration for AI guidance and result explanations.

## Stack

- Frontend: React, TypeScript, Vite, React Router, Zustand, Framer Motion, react-i18next, Tailwind CSS, react-hook-form, zod
- Backend: Node.js, TypeScript, Express, Prisma ORM, PostgreSQL, JWT auth, bcryptjs, Helmet, CORS, rate limiting, structured JSON request logs
- AI: Groq OpenAI-compatible chat completions through the backend only
- Quality: Vitest, ESLint, TypeScript builds, style-manifest and novelty validators

## Folder Structure

```text
src/                    React frontend
  app/                  route config and app shell
  components/           reusable UI, layout, and domain cards
  pages/                product pages, including /admin
  services/             API client, mock services, and real API repositories
  store/                persisted Zustand slices
  i18n/                 English and Russian translations
  styles/               light theme tokens, layout, motion, responsive CSS

server/                 Express + Prisma backend
  prisma/               PostgreSQL schema, migration, seed script
  src/
    config/             env validation
    db/                 Prisma client
    middleware/         auth, role guard, error handler
    modules/            auth, test, professions, guide, profile, admin, health
    services/           Groq integration
```

## Environment

Frontend `.env`:

```text
VITE_API_BASE_URL=http://localhost:4000/api
VITE_USE_MOCK_API=false
```

Backend `server/.env`:

```text
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/way
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
GROQ_API_KEY=change_me
GROQ_MODEL=openai/gpt-oss-120b
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

Never commit real secrets. If `GROQ_API_KEY` is missing or left as `change_me`, the API returns safe fallback guidance instead of failing the product flow.

## Local Setup

PowerShell blocks `npm.ps1` on this machine, so use `npm.cmd`.

```bash
npm.cmd install
npm.cmd --prefix server install
```

Start PostgreSQL locally, then create a database named `way`. Docker example:

```bash
docker run --name way-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=way -p 5432:5432 -d postgres:16
```

Prepare the backend:

```bash
copy server\.env.example server\.env
npm.cmd --prefix server run prisma:migrate
npm.cmd --prefix server run prisma:seed
```

Seeded credentials:

```text
Admin:   admin@way.local / Admin12345!
Student: student@way.local / Student12345!
```

Run the app in two terminals:

```bash
npm.cmd run dev:server
npm.cmd run dev:frontend
```

Open `http://localhost:5173`.

## Scripts

Frontend:

```bash
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run validate:manifest
npm.cmd run validate:novelty
npm.cmd run build
```

Backend:

```bash
npm.cmd --prefix server run typecheck
npm.cmd --prefix server run build
npm.cmd --prefix server run prisma:generate
npm.cmd --prefix server run prisma:migrate
npm.cmd --prefix server run prisma:seed
```

## Backend Overview

The API is mounted at `/api` and includes:

- `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/test/questions`, `POST /api/test/start`, `POST /api/test/answer`, `POST /api/test/submit`
- `GET /api/test/results/latest`, `GET /api/test/results/:id`
- `GET /api/professions`, `GET /api/professions/:slug`, save/remove/list saved professions
- `GET /api/profile`, `PATCH /api/profile`
- `GET /api/guide/topics`, conversations, persisted messages
- `GET /api/admin/stats`, user list/detail/update/status/role
- `GET /api/health`

Authentication is JWT-based. Passwords are hashed with bcryptjs. Private routes require `Authorization: Bearer <token>`, and admin routes require the `admin` role.

## Database

Prisma uses PostgreSQL only. The schema includes users, professions, translated test questions/options, attempts, answers, results, saved professions, guide conversations/messages, result recommendations, and admin audit logs.

The scoring engine is deterministic first: it scores answer tags, derives strengths, work style, environment, directions, and profession matches. Groq then refines the natural-language result explanation, so the product does not depend on raw LLM guessing.

## Frontend Integration

The frontend keeps the existing service architecture:

- Mock services still exist for tests and fallback.
- `src/services/apiRepositories.ts` contains real API-backed repositories.
- `src/services/repositories.ts` switches by `VITE_USE_MOCK_API`.
- `src/services/apiClient.ts` centralizes base URL, JSON handling, and bearer-token injection.

The login/signup, profile, test submit, results, professions save/remove, guide chat, and admin dashboard now call the backend. Zustand persists the client session token and useful UI state, never passwords.

## Admin Panel

The `/admin` route is protected in the UI and by the backend. It shows total users, active users, completed tests, saved professions, guide conversations, recent signups, and a searchable user table. Admins can activate/deactivate users and switch user/admin roles. Changes are written to `AdminAuditLog`.

## Landing Motion Fix

The landing page uses a controlled desktop slide stack instead of native page drift:

- one wheel gesture moves one slide
- transition locking prevents accidental skipping
- the footer cannot appear during slide navigation
- the indicator animates smoothly as the active slide changes
- mobile and reduced-motion users get natural scrolling

The transparent W.A.Y. logo remains integrated in the header and footer through `public/way-logo.png`.

## Russian-First UX

Russian is the default first-run language. The language switcher persists the chosen locale, and the backend stores `preferredLanguage` per user so W.A.Y. Guide and result explanations can behave Russian-first.

## Security Notes

- Secrets live only in env vars.
- Groq is called only from the backend.
- Helmet, CORS, rate limiting, JSON size limits, validation, auth middleware, role middleware, and centralized error handling are enabled.
- Logs redact secrets by never writing authorization headers.
- The stateless logout endpoint clears client session state; token revocation/refresh-token rotation can be added later.

## Known Limitations

- Email verification, password reset, refresh-token rotation, and production observability are not implemented yet.
- The frontend bundle still emits a Vite chunk-size warning; route-level lazy loading is the next cleanup.
- Seed data is intentionally small, but the schema is ready for a larger catalog.
