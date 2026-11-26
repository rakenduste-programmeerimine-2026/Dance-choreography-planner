# Tantsukava (Dance-choreography-planner)

A web app for planning a dance as a sequence of scenes: where each dancer stands, the path they take to the next scene, and the whole choreography played back as one continuous animation.

## Problem

Choreographers, dance coaches and dance teachers plan formations on paper or with tools that show static positions. Static drawings and ArrangeUs show where dancers stand in each scene, but not how they move between scenes. Transitions are where collisions and timing problems appear, so they are the hardest part to plan and explain to dancers.

## Scope

Three features:

1. Create, rename and delete choreographies. Add, rename, set gender for and delete dancers. Add, rename, reorder and delete scenes, and drag dancers to their places on the stage in each scene.
2. For each scene after the first, show every dancer's path from the previous scene, add, drag and remove waypoints, and set the transition duration.
3. Play the whole choreography as an animation: scenes follow one another and dots move along their paths.

Users sign in with Google and see only their own choreographies. The UI is in Estonian and targets desktop and tablet.

Not in scope: sharing a choreography, video export, music sync and multi-user editing.

## Success criterion

A user creates a choreography of several scenes, sets the dancers' movement paths and watches the whole choreography as one continuous animation. This is being confirmed with the contact person, a choreography student and dance coach.

## Setup

The app runs locally against a local Supabase (see "Local development") and is deployed to Vercel against a hosted Supabase project (see "Deployment").

### Deployment

Hosting: Vercel for the app, a hosted Supabase project (free tier, EU region) for Postgres and Auth. The Vercel project belongs to Tanel Metshein (W1ttyRat). The Supabase project `tantsukava` (West EU, Ireland) lives in the "argoluur's tp" organization. Production URL: https://dance-choreography-planner.vercel.app. Agents and CI never change hosted data; the steps below are done by humans.

The Vercel GitHub app is not installed on the course organization, so Vercel deploys from a fork, `W1ttyRat/Dance-choreography-planner`, not from the organization repo. After each merge to main in the organization repo, sync the fork so production updates:

```sh
gh repo sync W1ttyRat/Dance-choreography-planner
```

Environment variables (names only, set in the Vercel project settings for Production and Preview):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL from the hosted Supabase dashboard (Project Settings, API) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key from the same page |

The Google client ID and secret are not Vercel variables. They are set in the Supabase dashboard (step 3).

One-time setup, in this order:

1. **Supabase project (Tanel).** Create a project in an EU region. Link it locally with `npx supabase link --project-ref <ref>`.
2. **Vercel project (Tanel).** Fork the repo to your own GitHub account, give the Vercel GitHub app access to the fork, import it, keep the Next.js defaults and add the two variables above. Note the production URL.
3. **Google sign-in (Tanel).**
   - In Google Cloud, create an OAuth client (Web application). Add `https://<project-ref>.supabase.co/auth/v1/callback` as an authorized redirect URI.
   - Set the OAuth consent screen publishing status to "In production", so any Google account can sign in.
   - In the Supabase dashboard, Authentication, Providers, enable Google and paste the client ID and secret.
4. **Supabase redirect URLs (Tanel).** In Authentication, URL Configuration, set Site URL to the production URL and add Redirect URLs `https://<production-domain>/**` and a Vercel preview wildcard, `https://*-<vercel-team-slug>.vercel.app/**`. Check the exact preview URL pattern in the Vercel dashboard.
5. **First migration push.** After the database PR is merged to main, run `npx supabase db push` (see below).
6. **Verify.** Open the production URL, sign in with Google and check that `/` loads with your name. Then open a Vercel preview URL and sign in there too.

#### Migrations

Migrations live in `supabase/migrations` and are the only way to change the schema, never Studio. After each migration PR is merged to main, Tanel runs from an up-to-date main:

```sh
npx supabase db push
```

`db push` changes the hosted database, so run it only after the team approves the merged PR. It is not automated in CI.

Migrations are additive only: add tables, columns, constraints and functions, but never drop or rename anything. Older Vercel previews share the hosted database, so a destructive migration would break them. To retire a column, stop using it in code and leave it in the database.

### Local development

Stack: Next.js (App Router, TypeScript strict, Tailwind), Supabase (Postgres, Auth), Vitest, Playwright.

Requirements: Node.js 24 and Docker (Docker Desktop on Windows and macOS).

1. Install dependencies:
   ```sh
   npm install
   ```
2. Start local Supabase (Postgres, Auth and Studio in Docker):
   ```sh
   npx supabase start
   ```
   `npx supabase status` prints the local API URL, the publishable key and the Studio URL.
3. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from `npx supabase status`.
4. For local Google sign-in, set `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` in `supabase/.env` (git-ignored) or in your shell, then restart Supabase with `npx supabase stop` and `npx supabase start`. `supabase/config.jsonc` reads them from there. The Google OAuth client must list `http://127.0.0.1:54321/auth/v1/callback` as an authorized redirect URI. The email provider is enabled locally so Playwright can sign in a seeded test user. The hosted project uses Google only.
5. Start the app and open it at http://127.0.0.1:3000 (not `localhost`: local Supabase Auth only redirects back to its `site_url`, which is `127.0.0.1`):
   ```sh
   npm run dev
   ```

### Sign-in

Signed-out users are sent to `/login`, which has a "Logi sisse Google'iga" button. Google returns to `/auth/callback`, which exchanges the code for a session and opens `/`. `proxy.ts` refreshes the session on every request and verifies it with `getClaims()`. The "Logi välja" button on `/` signs out and returns to `/login`.

Never commit `.env.local`, `supabase/.env` or any secret value. `.env.example` holds variable names only.

### Choreographies

`/` lists the signed-in user's choreographies and has a form to create one (title 1–100 characters, stage width and depth 1–50 m, default 10 × 8; creating also creates "Stseen 1" through `create_choreography`). Each item can be renamed and resized under "Muuda" (the note "Mõõtude muutmine venitab paigutust" is shown) and deleted after a `confirm()`. The list is read per request through the user's session and RLS, never from a shared cache. Server Actions in `app/choreographies/actions.ts` check the session and validate input with the type guards in `lib/choreography-input.ts` before writing.

### Dancers

Each title in the list opens `/choreographies/[id]`. Its dancer panel adds a dancer (next unused number as label, gender `naine`, at the first free slot of a 6×5 grid in the shown scene, at the same spot in every scene; disabled at 30), edits the label (1–3 characters, unique ignoring case, saved on blur or Enter) and the gender, and deletes a dancer from every scene after a `confirm()`. Add and delete go through `add_dancer` and `delete_dancer`, so every scene changes or none. The page shows "Salvestatud", "Salvestan…" or "Salvestamine ebaõnnestus" with "Proovi uuesti", which resends the latest change. The shown scene is the `scene` search param (`/choreographies/[id]?scene=<scene id>`), falling back to the first scene. Gender colors are the theme colors `mees` (`blue-600`) and `naine` (`pink-500`) in `app/globals.css`, used as `bg-mees`, `fill-naine` and so on. The dancer type guards are in `lib/dancers.ts`.

### Scripts

| Script | What it runs |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Next.js route type generation, then `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run test:db` | pgTAP database tests (`supabase test db`, needs local Supabase running) |

## Tests

CI (`.github/workflows/ci.yml`) runs on every PR and on pushes to main: lint, typecheck, Vitest, pgTAP against a local Supabase (`supabase start`, `supabase test db`) and Playwright against a built app. It needs no secrets and no Google env vars.

To run the same checks locally, start Supabase (`npx supabase start`), then:

```sh
npm run lint
npm run typecheck
npm test
npm run test:db
npx playwright install chromium   # once
```

Playwright reads the Supabase URL and key from the environment. In PowerShell:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321"
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "<PUBLISHABLE_KEY from npx supabase status>"
npm run test:e2e
```

`supabase/seed.sql` creates a local test user (`test@example.com`, local only). `e2e/auth.ts` signs it in through the local Supabase API and sets the session cookies, so the app needs no password sign-in UI.

### Database

`supabase/migrations` creates `choreographies` and `scenes` with CHECK constraints, RLS (owners only, no `anon` access) and the multi-row functions `create_choreography`, `reorder_scenes`, `delete_scene`, `add_dancer` and `delete_dancer`. Regenerate the TypeScript types after a schema change:

```powershell
npx supabase gen types typescript --local > lib/supabase/database.types.ts
```

Test results: the pgTAP suite (`supabase/tests/choreographies.test.sql`, 53 tests covering RLS, constraints, `updated_at` and the functions) and the smoke test pass. Vitest: 5 tests for the choreography input guards (`lib/choreography-input.test.ts`) pass. More results will be listed here as more tests land.

## Team

| Member | GitHub | Role |
|---|---|---|
| Tanel Metshein | W1ttyRat | DB & quality |
| Gert Matthias Eljas | GertMatthias | FE & UX |
| Argo Luur | argoluur | BE & security |
