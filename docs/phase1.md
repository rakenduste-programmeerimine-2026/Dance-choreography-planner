# Phase 1: Project setup

Run once, when a team member says "Start Phase 1". CLAUDE.md rules apply throughout.

## Steps
1. Check that `gh` is signed in, that the remote is `rakenduste-programmeerimine-2026/Dance-choreography-planner`, and that the three team members have access. If anything is missing, report it and stop.
2. Print the full plan: labels, milestones, the project board, and every issue below with its title, labels, milestone, assignee and acceptance criteria. Wait until a team member says "go". Create nothing before that.
3. Create labels with prefixes, so a type and a scope with the same name stay separate:
   - `type:build`, `type:ci`, `type:docs`, `type:feat`, `type:fix`, `type:perf`, `type:refactor`, `type:test`
   - `scope:scenes`, `scope:paths`, `scope:playback`, `scope:auth`, `scope:db`, `scope:ui`, `scope:ci`, `scope:docs`, `scope:app`
   - `later`
   If a label with the same name already exists, leave it and report it.
4. Create milestones M0–M4 with the due dates from CLAUDE.md decision 8.
5. Create an organization project board named "Dance-choreography-planner", linked to the repo, with Status values Todo, In Progress, In Review and Done. Check `gh project --help` for the exact commands. If `gh` lacks a needed scope or permission, or a Status value cannot be added, stop and tell the team exactly what a human must do in the browser.
6. Create the issues in the order below. Each issue gets the `type:` and `scope:` labels matching its title. Each issue body has a one-sentence user story, acceptance criteria as a checklist, and "Out of scope" when useful. Add every issue to the board as Todo.
7. On branch `docs/1-claude-md-and-readme`, commit CLAUDE.md, this file and a README skeleton. Push, open a PR with `Closes #1`, move issue 1 to In Review, then stop.

Phase 1 is done when every label, milestone and issue exists, the board shows them, and the PR for issue 1 is open. Report the links.

## Issue plan
M0 Foundation
1. docs(docs): add CLAUDE.md, Phase 1 plan and README skeleton (problem, scope, success criterion, setup placeholder) — GertMatthias
2. build(app): scaffold the Next.js app, init the Supabase CLI, add `.env.example` with names only — argoluur
3. ci(ci): GitHub Actions for lint, typecheck, Vitest, pgTAP and Playwright against local Supabase — w1ttyrat
4. feat(db): `choreographies` and `scenes` tables, constraints, RLS, multi-row functions, generated types, pgTAP tests — w1ttyrat
5. feat(auth): Google sign-in and sign-out, `proxy.ts`, signed-out users redirected to sign-in — argoluur
6. build(app): deploy to Vercel with the hosted Supabase project and document the steps humans do — w1ttyrat

M1 Scenes and placement
7. feat(scenes): choreography list page with create, rename and delete — GertMatthias
8. feat(scenes): dancer management with label and gender, gender colors, add and delete across all scenes — argoluur
9. feat(scenes): SVG stage editor with grid toggle, drag dancers, save on pointer up — GertMatthias
10. feat(scenes): add, rename, reorder and delete scenes; a new scene copies the previous positions — argoluur

M2 Paths
11. feat(paths): pure geometry module (centripetal Catmull-Rom, arc-length sampling, degenerate paths) with Vitest tests — argoluur
12. feat(paths): path editing UI with add, drag and remove waypoints — GertMatthias
13. feat(paths): transition duration per scene with validation — w1ttyrat

M3 Playback
14. feat(playback): playback view with play/pause and start scene, constant-speed movement along paths — GertMatthias
15. test(app): Playwright end-to-end flow from creating a choreography to playing it — w1ttyrat

M4 User test and release
16. docs(docs): user test with the contact, feedback summary, completed and unfinished requirements in README — w1ttyrat (the session itself is run by the whole team)

The improvement issue from the feedback is created after the user test on 2026-12-01, in milestone M4, not in Phase 1.

Later (label `later`, no milestone, no assignee)
17. feat(app): read-only share link for a choreography
18. feat(playback): export the animation as a video
