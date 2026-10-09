# Full local integration

`integration/full-local` preserves the histories of all inspected local and
remote branches. Its independent source heads were `p2-complete` (0297e4f),
`p1-shell` (6bdac0b), `p5-work` (68cee2c), `dev` (e332099), and
`feat/demo-mode` (ef4e89f), the newer `feature/person4` (bef2436), and
`final-polish` (390fb2a, also the fetched remote main). All 20 inspected local
and remote branch heads are preserved by ancestry. Local `main` remains at
75a7bd1; it was not checked out or modified. The old standalone demo's mocked dashboard was reconciled with
the real baseline/dashboard implementation, while retaining its commit history
and compatible demo entry button.

The integrated app includes six crew profiles and QR badge dialogs, the dashboard,
baseline trends, multi-metric local check-ins and descriptive self-report details,
decision history, three complete runtime demo scenarios, a four-step guide,
English/Myanmar, dark/light themes, and the optional NASA proxy.
All health telemetry is clearly labeled synthetic demonstration data. The
existing server-side key and Vercel function are retained; no database was added.

## Run locally (PowerShell, Node 22.18+)

Keep the existing ignored `.env`. If starting a new checkout, copy
`.env.example` only when `.env` does not exist and enter `NASA_API_KEY` directly
in that local file. Never put a secret in a `VITE_` variable or chat.

Backend terminal, from the repository root:

```powershell
npm run build:server
$env:SERVER_PORT='3002'
$env:FRONTEND_ORIGIN='http://127.0.0.1:5184'
node --env-file=.env server/dist/index.js
```

Frontend terminal, from the same root:

```powershell
$env:API_PROXY_TARGET='http://127.0.0.1:3002'
npm run dev -- --host 127.0.0.1 --port 5184 --strictPort
```

Open http://127.0.0.1:5184/ or the commander brief at
http://127.0.0.1:5184/crew/ac-cmdr-01. The frontend requests its same-origin
`/api/space-weather`; Vite forwards it to the backend on port 3002. Missing NASA
configuration or a stopped backend leaves the labeled synthetic fallback and
the full crew journey available.

## Verification executed on 2026-10-09

- A fresh `npm ci` completed after stopping old repository dev/preview processes
  that held Windows native dependency file locks.
- `npm test`: 25/25 passed (NASA proxy/serverless/client fallback, baseline,
  atomic storage/migration/duplicate handling, unavailable vs empty history,
  demo isolation/clock/reset, and 334 bilingual keys).
- `npm run test:brief`: passed its fixture TypeScript/Vite/SSR contract checks.
  React Router's existing isolated SSR `useLayoutEffect` warnings remain.
- `npm run build`, `build:server`, `build:function`: passed, including TypeScript.
  The final route-split frontend build has no large-chunk warning.
- Browser: six crew profiles, all three scenarios, guide steps, QR generation
  and link copy, form validation, multi-field check-in save and dashboard updates,
  duplicate guard, decision/history columns, scoped reset, metric selector
  keyboard interaction, shaded chart/tooltip, mobile navigation, and EN/MY in
  both themes at 390/1024/1440 widths. No horizontal overflow; primary CTA is 44px.
  The earlier integration pass also exercised all three decision actions and
  fallback with the proxy deliberately stopped.
- Latest NASA local connection: frontend proxy returns HTTP 504 on upstream
  timeout; the browser honestly displays synthetic fallback. An earlier local
  pass returned HTTP 200 JSON with three normalized NASA CCMC events. Live
  availability is external and gateway API-key validity remains unverified.
- `npm audit --omit=dev` reports two moderate dependency entries for the existing
  React Router 6 chain. Its proposed fix is a major-version upgrade; no forced
  or unrelated dependency migration was applied during integration.

Synthetic dates shift together at session start so the demonstration still
works on a later day. Personal check-in timestamps are never moved. Demo
records use their own storage envelope; entering/switching/resetting scenarios
never clears the normal user record envelope.

No push, deployment, branch deletion, database change, or update to `main` is
part of this local integration. Vercel cloud packaging/deployment validation
remains separate; see [Vercel setup](../server/VERCEL.md).

The user-created untracked `astrocare.pptx` is left untouched and outside the
integration commit. Local secrets remain ignored; the configured key is absent
from staged source and built browser assets.
