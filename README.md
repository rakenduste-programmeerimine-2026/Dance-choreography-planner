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

Deployment is added in #6.

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
4. For local Google sign-in, set `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` in `supabase/.env` (git-ignored) or in your shell, then restart Supabase with `npx supabase stop` and `npx supabase start`. `supabase/config.jsonc` reads them from there. The email provider is enabled locally so Playwright can sign in a seeded test user. The hosted project uses Google only.
5. Start the app at http://localhost:3000:
   ```sh
   npm run dev
   ```

Never commit `.env.local`, `supabase/.env` or any secret value. `.env.example` holds variable names only.

### Scripts

| Script | What it runs |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Next.js route type generation, then `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run test:db` | pgTAP database tests (`supabase test db`, needs local Supabase running) |

## Team

| Member | GitHub | Role |
|---|---|---|
| Tanel Metshein | W1ttyRat | DB & quality |
| Gert Matthias Eljas | GertMatthias | FE & UX |
| Argo Luur | argoluur | BE & security |
