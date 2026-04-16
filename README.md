# W.A.Y. Django Templates Application

W.A.Y. means **Who Are You**. It is a Russian-first career guidance and self-discovery product for school students, now delivered primarily through Django views, Django Templates, server-rendered forms, Django static files, and small focused JavaScript.

The React + TypeScript + Vite SPA has been retired from the active project. Django is now responsible for page rendering, authentication, career-test submission, result rendering, professions, profile, W.A.Y. Guide, admin pages, theme support, and the custom branded 404 page.

## Stack

- Backend and web app: Python, Django, Django Templates, Django forms, Django sessions
- API compatibility layer: Django REST Framework and SimpleJWT remain available under `/api/`
- Database: PostgreSQL-ready Django ORM models, with SQLite fallback when `DATABASE_URL` is not set
- AI: Groq OpenAI-compatible chat completions from the Django server only
- Static assets: Django static files in `server/static/way/`
- UX: light/dark theme tokens, animated ASCII W.A.Y. logo, custom 404, small vanilla JavaScript

## Project Structure

```text
server/
  manage.py
  requirements.txt
  way_backend/
    settings.py                 Django settings
    urls.py                     root URLs for templates and API
  way_api/
    models.py                   users, professions, tests, results, guide, admin audit data
    forms.py                    template-facing auth/profile forms
    web_views.py                server-rendered product views
    web_urls.py                 Django Templates routes
    views.py                    DRF compatibility API views
    serializers.py              DRF serializers
    services/
      scoring.py                deterministic trait scoring and profession ranking
      results.py                shared result generation service
      groq.py                   backend-only Groq integration and deterministic fallback
    management/commands/
      seed_way.py               idempotent demo data seed
  templates/way/
    base.html                   shared product shell
    home.html                   homepage
    about.html                  about page
    onboarding.html             onboarding page
    test.html                   career test form
    guide.html                  W.A.Y. Guide
    profile.html                profile page
    404.html                    standalone branded 404
    auth/                       login and signup templates
    professions/                list and detail templates
    results/                    empty and detail result templates
    admin/                      product admin templates
  static/way/
    css/app.css                 design tokens, layout, components, responsive styles
    js/app.js                   theme toggle, nav, landing slides, reveal motion, ASCII mutation, guide AJAX, test progress
    img/                        logo and favicon
```

## Environment

Create `server/.env` from `server/.env.example`:

```text
DJANGO_DEBUG=true
DJANGO_SECRET_KEY=replace_with_a_long_random_secret
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/way
CLIENT_URLS=http://localhost:4000
ALLOWED_HOSTS=localhost,127.0.0.1
GROQ_API_KEY=change_me
GROQ_MODEL=openai/gpt-oss-120b
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

Do not commit real secrets. If `GROQ_API_KEY` is missing or set to `change_me`, W.A.Y. returns deterministic fallback guide/result text so the product flow still works.

## Local Setup

```bash
python -m pip install -r server/requirements.txt
copy server\.env.example server\.env
cd server
python manage.py migrate
python manage.py seed_way
python manage.py runserver 4000
```

Open `http://localhost:4000`.

PostgreSQL Docker example:

```bash
docker run --name way-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=way -p 5432:5432 -d postgres:16
```

## Seeded Accounts

`python manage.py seed_way` is idempotent. It bulk-upserts professions, test questions, answer options, and recreates demo credentials with valid Django password hashes every run:

```text
admin@way.local / Admin12345!
student@way.local / Student12345!
```

PostgreSQL connections use a short connection timeout so a bad `DATABASE_URL` fails quickly instead of hanging indefinitely.

## Template Routes

- `/` home
- `/about/`
- `/onboarding/`
- `/login/`
- `/signup/`
- `/logout/`
- `/professions/`
- `/professions/<slug>/`
- `/test/`
- `/results/`
- `/results/<id>/`
- `/guide/`
- `/profile/`
- `/way-admin/`
- custom Django `handler404`

The DRF compatibility API remains mounted at `/api/` for integrations and focused async use, but it is no longer the primary frontend delivery mechanism.

## Authentication

The template app uses Django session authentication:

- Login is handled by `LoginForm` and `django.contrib.auth.login`
- Signup creates the custom `User` model and immediately starts a session
- Logout is a CSRF-protected POST
- Profile, test, results, guide, saved professions, and admin pages require session auth where appropriate
- Admin product pages require `user.role == "admin"`

The API layer still supports SimpleJWT for `/api/` routes. Public API endpoints disable authentication so stale bearer tokens cannot poison public reads.

## Career Test and Results

The career test is now a server-rendered form in `templates/way/test.html`. The form posts selected answers to `web_views.career_test`, which calls the shared `create_result` service.

Result generation is shared by templates and API:

1. Selected answer options are converted into structured trait signals.
2. Existing catalog professions are scored deterministically.
3. The backend selects one primary profession and three alternatives.
4. Match percentages are normalized from computed scores.
5. Groq receives only locked ranked data for short JSON-only interpretation.
6. If AI fails or returns invalid data, deterministic fallback text is saved.

Results render through `templates/way/results/detail.html` with the primary match, alternatives, percentages, explanation bullets, and next actions.

## W.A.Y. Guide

Guide is rendered by Django in `templates/way/guide.html`. Messages are persisted as `GuideConversation` and `GuideMessage` rows.

Small JavaScript in `server/static/way/js/app.js` submits guide messages asynchronously when possible and falls back to a normal POST if JavaScript or the network fails. Groq remains server-side only.

## Professions and Saved Items

Professions are rendered by Django templates:

- list page with category/search filtering
- detail page with skills and scoring tags
- CSRF-protected save/remove action for authenticated users

Saved professions appear on the profile page.

## Theme System

Light/dark mode is implemented with CSS tokens in `server/static/way/css/app.css`.

The theme switcher in `base.html` uses a small vanilla JS controller:

- toggles `document.documentElement.dataset.theme`
- persists the selection in `localStorage`
- applies early in the document head to avoid visual flashing

The palette preserves the W.A.Y. product feel: cool off-white surfaces and refined accents in light mode, deep graphite/navy surfaces with controlled cyan/blue/violet glow in dark mode.

## Homepage Slide Navigation

The homepage is a desktop slide-based landing experience again. `templates/way/home.html` uses `landing-story`, `landing-track`, and `landing-slide` sections. `server/static/way/js/app.js` listens for wheel and keyboard events on desktop widths and moves the track one full slide at a time with controlled easing.

On desktop, the body is temporarily locked while the landing story is active so the footer and random page fragments do not appear between slides. On mobile and narrow tablets, the slide controller disables itself and the page returns to natural document scrolling.

## Motion and Visual Restoration

The design restoration is concentrated in `server/static/way/css/app.css`:

- stronger layered surfaces and frame shadows
- restored card hover lift and glow depth
- polished button transitions and focus states
- premium pill/tag treatment with consistent sizing, border, background, and typography
- section/card reveal animation through a small IntersectionObserver helper
- active homepage slide reveal choreography
- responsive navigation that keeps the hamburger hidden on desktop and only shows it on smaller breakpoints

## ASCII Logo and 404

The homepage hero and 404 page use a large text-only ASCII W.A.Y. logo in `templates/way/partials/ascii_logo.html`.

`app.js` mutates visible characters from a curated symbol pool while preserving whitespace and the overall silhouette. The 404 page is standalone, has no header/footer, includes rotating typed Russian subtitles, and routes back home.

## Static Assets

Django serves project static files from:

```text
server/static/way/
```

During production deployment, run:

```bash
python manage.py collectstatic
```

## Validation

```bash
cd server
python manage.py check
python -m compileall way_backend way_api
python manage.py seed_way
```

The template migration has been smoke-tested with Django’s test client for:

- major page rendering
- login
- profile
- guide
- test submission
- result rendering
- custom 404

## Migration Notes

- The active product is no longer a Vite SPA.
- React source, Vite config, frontend package metadata, Vite build output, and public SPA assets were retired from the active tree.
- Business logic, database models, deterministic scoring, Groq integration, admin behavior, and API compatibility were preserved.
- The product now favors server-rendered Django pages with small JavaScript only for high-value interactions.
