# W.A.Y. Full-Stack MVP

W.A.Y. means **Who Are You**. It is a Russian-first career guidance and self-discovery platform for school students with a polished TypeScript frontend and a Django REST backend.

The project now includes JWT authentication, PostgreSQL-ready persistence, saved professions, deterministic career-test results, backend-only Groq integration, W.A.Y. Guide conversations, an admin API, full light/dark theming, animated ASCII logo treatments, and a custom SPA 404 page.

## Stack

- Frontend: React, TypeScript, Vite, React Router, Zustand, Framer Motion, react-i18next, Tailwind CSS, react-hook-form, zod
- Backend: Python, Django, Django REST Framework, SimpleJWT, PostgreSQL-ready ORM models, django-cors-headers
- AI: Groq OpenAI-compatible chat completions through the Django backend only
- Quality: Vitest, ESLint, TypeScript builds, Django checks, DRF serializers, service-layer scoring

## Folder Structure

```text
src/                         React frontend
  app/                       route config and app shell
  components/                reusable UI, layout, cards, and ASCII logo components
  hooks/                     theme-safe animation utilities
  pages/                     product pages, including /admin and custom 404
  services/                  API client, mock services, and API repositories
  store/                     persisted Zustand slices for auth, theme, language, test state
  i18n/                      English and Russian translations
  styles/                    theme tokens, layout, motion, responsive CSS

server/                      Django backend
  manage.py                  Django entrypoint
  requirements.txt           backend dependencies
  way_backend/               Django settings, ASGI/WSGI, root urls
  way_api/                   API models, serializers, views, urls, services, migrations
    services/scoring.py      deterministic answer scoring and profession ranking
    services/groq.py         backend-only Groq JSON/fallback integration
    management/commands/     seed command for local demo data
```

The previous Node/Express/Prisma backend has been removed from the active backend tree. The active backend is Django.

## Environment

Frontend `.env`:

```text
VITE_API_BASE_URL=http://localhost:4000/api
VITE_USE_MOCK_API=false
```

Backend `server/.env`:

```text
DJANGO_DEBUG=true
DJANGO_SECRET_KEY=replace_with_a_long_random_secret
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/way
CLIENT_URL=http://localhost:5173
ALLOWED_HOSTS=localhost,127.0.0.1
GROQ_API_KEY=change_me
GROQ_MODEL=openai/gpt-oss-120b
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

Never commit real secrets. If `GROQ_API_KEY` is missing or left as `change_me`, the API returns deterministic fallback guidance instead of breaking the user flow.

## Local Setup

PowerShell blocks `npm.ps1` on this machine, so use `npm.cmd`.

```bash
npm.cmd install
python -m pip install -r server/requirements.txt
```

Start PostgreSQL locally and create a database named `way`. Docker example:

```bash
docker run --name way-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=way -p 5432:5432 -d postgres:16
```

Prepare the backend:

```bash
copy server\.env.example server\.env
cd server
python manage.py migrate
python manage.py seed_way
cd ..
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
python server/manage.py check
python server/manage.py makemigrations
python server/manage.py migrate
python server/manage.py seed_way
npm.cmd run build:server
```

## Django Backend Architecture

The API is mounted at `/api` and preserves the frontend contract:

- `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/test/questions`, `POST /api/test/submit`
- `GET /api/test/results/latest`, `GET /api/test/results/:id`
- `GET /api/professions`, `GET /api/professions/:slug`, save/remove/list saved professions
- `GET /api/profile`, `PATCH /api/profile`
- `GET /api/guide/topics`, conversations, persisted messages
- `GET /api/admin/stats`, user list/detail/status/role endpoints

Authentication uses SimpleJWT. Private routes require `Authorization: Bearer <token>`. Admin routes require the user role `admin`.

The Django schema includes users, professions, test questions/options, attempts, answers, results, result recommendations, saved professions, guide conversations/messages, and admin audit logs.

## Career-Test Result Pipeline

The result system is deterministic first and AI-assisted second.

1. `way_api/services/scoring.py` maps selected answers into weighted trait signals such as logic, analytical thinking, creativity, communication, technical interest, helping people, structure, teamwork, independence, visual interest, research orientation, leadership, and organization.
2. Profession vectors are built from the existing `Profession.scoring_tags` plus category fallback weights.
3. The backend compares the user vector to every profession vector, ranks catalog professions, selects one primary profession plus three alternatives, and derives normalized match percentages from computed scores.
4. Deterministic result text is generated for summary, strengths, work style, preferred environment, directions, roadmap, and per-profession reasons.
5. Groq receives only locked structured ranked data. It cannot invent professions, decide rankings, or change percentages.

## AI JSON-Only Behavior

`way_api/services/groq.py` requests strict JSON from Groq for result interpretation:

```json
{
  "primaryProfessionSlug": "ux-designer",
  "primaryMatchPercent": 92,
  "alternatives": [
    { "slug": "frontend-developer", "matchPercent": 86 },
    { "slug": "product-manager", "matchPercent": 81 },
    { "slug": "data-analyst", "matchPercent": 78 }
  ],
  "summary": "short clean explanation",
  "reasoning": ["reason 1", "reason 2", "reason 3"]
}
```

The backend verifies that slugs and percentages match the deterministic result exactly. Emoji are stripped. Invalid or unavailable AI output falls back to deterministic summary and reasoning bullets.

## Result Flow Fix

The test completion flow now handles submission as a real async state:

- submit errors are surfaced instead of leaving the user in a dead loading state
- successful results are persisted in Zustand before navigation
- navigation to `/results` uses `replace`
- the results page prefers the freshest backend result over stale local state
- AI delay or failure does not block a valid deterministic result

## Theme System

The app supports full light and dark modes through CSS design tokens in `src/styles/tokens.css`.

Light mode uses cool off-white surfaces, refined blue/cyan/violet accents, premium gray text hierarchy, subtle borders, and airy shadows.

Dark mode uses deep graphite/navy surfaces, restrained cyan/violet/blue accents, high-contrast text, and controlled glow depth.

Theme state is stored in `way.preferences.v1` through Zustand. The selected mode is applied to `document.documentElement.dataset.theme`, so all pages and the custom 404 route receive the correct tokens.

## Theme Toggle

The header includes a custom animated theme switcher:

- no default checkbox styling
- smooth thumb transition
- clear light/dark visual state
- hover and focus states
- persisted selection
- immediate app-wide theme update

## ASCII Logo Animation

The first homepage hero visual now uses `src/components/domain/AsciiWayLogo.tsx` instead of an image block.

The logo is rendered as actual text characters based on the provided ASCII reference. `useAsciiMutation` mutates only visible characters from a curated symbol pool while preserving whitespace and the W.A.Y. silhouette. The block uses cyan/blue/violet glow and responsive sizing for desktop and mobile.

The custom 404 page also uses text-only animated ASCII with a full-screen cinematic layout and rotating typed Russian subtitles via `useTypedRotatingText`.

## Frontend Integration

The frontend keeps the repository architecture:

- `src/services/apiClient.ts` centralizes base URL, JSON handling, DRF error handling, and bearer-token injection
- `src/services/apiRepositories.ts` maps frontend models to the Django API contract
- `src/services/repositories.ts` can still switch to mock services with `VITE_USE_MOCK_API=true`
- Zustand persists auth, language, theme, latest result, saved professions, guide conversations, and test progress

## Russian-First UX

Russian remains the default first-run language. The language switcher persists the chosen locale, and the backend stores `preferred_language` per user so W.A.Y. Guide and result explanations can remain Russian-first.

## Security Notes

- Secrets live only in environment variables.
- Groq is called only from Django.
- JWT auth, CORS restrictions, DRF validation, role checks, and Django password hashing are enabled.
- The logout endpoint is stateless for the current client flow.

## Known Limitations

- Email verification, password reset, refresh-token rotation, and production observability are not implemented yet.
- The frontend bundle still emits a Vite chunk-size warning; route-level lazy loading is the next cleanup.
- Seed data is compact, but the Django schema and scoring services are ready for a larger profession catalog.
