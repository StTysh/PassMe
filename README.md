# Interview Loop

Interview Loop is a local-first interview simulator and coaching app. It ingests a candidate's real materials, generates a role-aware interview plan, runs a realistic text interview, stores everything in local SQLite, and produces actionable review plus history.

The product is intentionally narrow:

- create a candidate profile
- upload a resume PDF or paste text
- paste a job description
- optionally add supporting context
- generate an interview plan with a hardcoded persona and settings
- run a text interview
- persist transcript, score, and coaching
- review progress locally

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn-compatible component setup
- SQLite only
- Drizzle ORM + better-sqlite3
- Zod validation
- TanStack Query
- react-hook-form
- Gemini through a single server-side abstraction

## Current status

The app now includes the full v1 text loop:

- profile CRUD
- document storage and chunking
- resume parsing and job analysis through the Gemini abstraction
- interview plan generation
- text interview runtime
- evaluation and coaching
- history page
- demo mode
- voice scaffolding behind a feature flag only

If `GEMINI_API_KEY` is not set, the app still runs with deterministic fallback behavior so the local demo stays usable.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment values:

```bash
copy .env.example .env
```

3. Initialize the database and seed personas/demo data:

```bash
npm run db:migrate
npm run seed
```

4. Start the app:

```bash
npm run dev
```

## Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run db:migrate
npm run seed
npm run dev:reset
```

## Environment variables

- `GEMINI_API_KEY`: Gemini API key for parsing, planning, interview generation, evaluation, and coaching
- `DATABASE_PATH`: local SQLite path, default `./data/interview-loop.sqlite`
- `ENABLE_VOICE`: reserved voice flag, default `false`
- `ENABLE_SEARCH_PAGE`: reserved search-page flag, default `false`
- `ENABLE_DEMO_MODE`: demo mode flag, default `true`

## Architecture overview

- `src/app`: pages and route handlers
- `src/components`: UI shell, forms, interview UI, review/history widgets
- `src/db`: SQLite client, pragmas, Drizzle schema, SQL migrations
- `src/lib/repositories`: DB-only access
- `src/lib/services`: orchestration, validation composition, planning, evaluation, history, demo seeding
- `src/lib/gemini`: one server-side Gemini abstraction

Route handlers stay thin. Repositories do not call Gemini. Services own orchestration.

## Demo mode

Run `npm run seed` to create the demo workspace:

- profile: `Alex Morgan`
- resume: PM / AI platform background
- job description: `Senior Product Manager, AI Platform`
- one completed sample session with review

You can re-seed demo data at any time from the Settings page or by running `npm run seed` again.

## Database notes

- SQLite is the only database
- DB file is created locally on first use or via `npm run db:migrate`
- startup pragmas include WAL, foreign keys, normal sync, memory temp store, and a busy timeout
- FTS5 virtual tables are used for documents, chunks, and transcript search

## Privacy note

Interview data is stored locally in SQLite on the machine running the app. Gemini calls send relevant text to Google for inference. There is no auth system and no cloud account system in v1.

## Known limitations

- Voice is scaffolded only, not implemented as a full product
- The current fallback AI behavior is heuristic when Gemini is unavailable
- Review/history are optimized for demo speed over exhaustive analytics
- Search is implemented as an API surface; a dedicated search page is still behind a flag

## Roadmap

- richer drill modes
- editable extracted resume text
- better trend charts
- searchable transcript viewer
- import/export of local data
- fuller voice path behind the existing feature flag
