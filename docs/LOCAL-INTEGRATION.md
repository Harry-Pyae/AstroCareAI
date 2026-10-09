# Full local integration

`integration/full-local` preserves the histories of all inspected local and
remote branches. Its independent source heads were `p2-complete` (0297e4f),
`p1-shell` (6bdac0b), `p5-work` (68cee2c), `dev` (e332099), and
`feat/demo-mode` (ef4e89f). The remaining branch heads were already ancestors
of those heads. The old standalone demo's mocked dashboard was reconciled with
the real baseline/dashboard implementation, while retaining its commit history
and compatible demo entry button.

The integrated app includes crew selection and QR deep links, the dashboard,
baseline trends, local check-ins and decision history, three complete demo
scenarios, English/Myanmar, dark/light themes, and the optional NASA proxy.
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

- `npm test`: 19/19 passed (NASA proxy/serverless/client fallback, baseline,
  storage integration, demo isolation/clock/reset, and bilingual coverage).
- `npm run test:brief`: passed its fixture TypeScript/Vite/SSR contract checks.
  React Router's existing isolated SSR `useLayoutEffect` warnings remain.
- `npm run build`, `build:server`, `build:function`: passed. The frontend build
  retains one informational large-chunk warning; this does not prevent output.
- Browser: all three crews/scenarios, all three decision actions, validation and
  check-in updates, scoped reset, metric selector keyboard interaction, chart
  shading/tooltip, both themes/languages at 390/1024/1440 widths, and labeled
  fallback with the proxy deliberately stopped.
- NASA local connection: HTTP 200 JSON with three normalized events through
  NASA CCMC. This verifies connectivity, not gateway API-key validity.

Synthetic dates shift together at session start so the demonstration still
works on a later day. Personal check-in timestamps are never moved. Demo
records use their own storage envelope; entering/switching/resetting scenarios
never clears the normal user record envelope.

No push, deployment, branch deletion, database change, or update to `main` is
part of this local integration. Vercel cloud packaging/deployment validation
remains separate; see [Vercel setup](../server/VERCEL.md).
