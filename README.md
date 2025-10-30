# Travel Expense & Itinerary Tracker — Starter Repo (Next.js + FastAPI + Supabase)

A production-oriented starter for a **Travel Expense & Itinerary Tracker**:
- **Frontend:** Next.js (App Router) + Tailwind + React Query
- **Backend:** FastAPI + SQLAlchemy + Alembic + Pydantic
- **Database:** Postgres (use **Supabase** in prod; optional local Postgres via Docker for dev)
- **Auth & Storage:** Supabase Auth & Storage (JWT verified by backend middleware)
- **Infra:** Docker Compose (api + web + optional db), CI-ready project layout

> This repo ships a working MVP: Trips, Participants, Expenses, Itinerary Items, Balances (who owes whom), FX snapshot caching, CSV import/export endpoints, and a minimal web UI.

---

## 1. Architecture

```
apps/
  api/            # FastAPI service
  web/            # Next.js 14 (App Router)
docker-compose.yml
```

### Data model (core tables)
- `trips` (home currency, dates, title)
- `participants` (display_name, weight, linked to trip)
- `itinerary_items` (type, title, location, start/end, notes)
- `expenses` (amount, currency, category, payer, beneficiaries split, fx_rate_to_home)
- `expense_splits` (custom/equal/weighted shares per participant)
- `exchange_rates` (daily snapshot cache per currency pair)

### Settlement algorithm
We compute net balances per participant in trip home currency and produce minimal cash transfers.

---

## 2. Local development

### Prereqs
- Node 20+
- Python 3.10+
- Docker + Docker Compose
- Supabase project (get `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`), or use local Postgres and disable auth verification in dev.

### .env files
Copy examples and fill in values:
- `apps/api/.env.example` → `apps/api/.env`
- `apps/web/.env.example` → `apps/web/.env.local`

### Start services
```bash
docker compose up --build
```
- API: http://localhost:8000 (docs at `/docs`)
- Web: http://localhost:3000

Run Alembic migrations:
```bash
docker compose exec api alembic upgrade head
```

Seed sample data:
```bash
docker compose exec api python scripts/seed.py
```

---

## 3. Production notes

- Point `DATABASE_URL` to your **Supabase Postgres** connection string.
- Set `SUPABASE_JWT_SECRET` and enable **JWT verification** in the API (already wired; can be disabled with `AUTH_DISABLED=true` for local).
- Use Supabase Storage for **receipt images** (signed URLs).
- Deploy options:
  - **Web:** Vercel or Docker on your host
  - **API:** Fly.io, Render, Railway, or your Kubernetes
  - **DB/Storage/Auth:** Supabase

---

## 4. Feature Roadmap (suggested)
- Per-diem and category budgets + variance charts
- Booking email parser (forward-to-trip)
- Shareable read-only trip link
- PDF reports with branding (server-side)

---

## 5. Scripts
- `apps/api/scripts/seed.py`: Adds example trip, participants, expenses, and itinerary items.

---

## 6. Security
- JWT verified from Supabase Auth (fastapi middleware)
- Row-level ownership checks by `sub` claims
- CORS restricted to configured web host

---

## 7. License
MIT
