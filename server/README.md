# NASA DONKI proxy

Node 22.18+ and the repository's existing TypeScript compiler are sufficient;
no new runtime dependencies or database are needed. This user-requested server
supersedes the old frontend-only architecture for the optional weather card.
The same DONKI logic and request handler also run as the Vercel function in
`api/space-weather.ts`. See [Vercel setup and deployment](VERCEL.md) for the
single-project frontend/function configuration and production secret setup.

From the repo root, copy `.env.example` to `.env` only if `.env` does not already
exist. Enter a newly generated `NASA_API_KEY` locally; never paste it into chat.
Keep the existing local key and add optional settings as needed:

```
SERVER_PORT=3001
FRONTEND_ORIGIN=http://127.0.0.1:5181
API_PROXY_TARGET=http://127.0.0.1:3001
```

Run commands from the repository root:

```
npm run dev:server
npm run dev -- --host 127.0.0.1 --port 5181 --strictPort
npm test
npm run build:server
node --env-file=.env server/dist/index.js
npm run build:function
npm run test:brief
npm run build
```

The `server/dist` command is the compiled local server alternative; run only one
server at a time. Build output under `server/dist` is Git-ignored. Frontend dev
requests `/api/space-weather` through Vite to port 3001. The proxy binds to
127.0.0.1 and allows only the configured frontend Origin (no wildcard CORS or
credentials). An Origin-free local CLI request is permitted. On Vercel,
`api/space-weather.ts` serves the same-origin route without starting this local
listener or requiring another hosting provider. Its permitted Origin is taken
from the deployment request URL, so Preview and custom domains need no hardcoded
frontend origin. Vite preview remains static; it does not emulate the Vercel
function. `build:function` checks the emitted TypeScript function imports; it is
not `vercel build` or a deployment packaging check.

## Upstream and errors

The API gateway endpoint is officially documented at
https://api.nasa.gov/DONKI/FLR. Diagnostics on 2026-10-09 found HTTP 200,
Content-Type text/html after redirect to CCMC. The current NASA reference lists
https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR:
https://ccmc.gsfc.nasa.gov/DONKI/api/#tag/events/GET/FLR.

The server uses the key only with the gateway. Redirects are manual. On a
redirect or HTML Content-Type, it calls only the documented CCMC endpoint,
which does not document a key parameter. No key is forwarded there; arbitrary
redirect targets are never followed. Upstream key rejection or rate limits are
not bypassed. CCMC success verifies data connectivity, not gateway key validity.

GET `/api/space-weather` returns `{source, upstream, fetchedAt, events}`. Only
flrID/beginTime/peakTime/classType are normalized and returned (latest 3 unique
valid events from the last 60 days). Empty arrays are valid live results. Error
status codes: 503 missing key; 504 timeout; 429 rate limit with bounded Retry-After;
502 rejected key, invalid JSON/schema/content-type or upstream failure. Errors
contain safe codes, never upstream bodies, secret URLs or raw fetch messages.
Upstream responses are bounded to 2MB with a total 8s timeout. Successful data
is cached for 60s, concurrent requests coalesce, and failures briefly back off.
On Vercel this cache is best effort within a warm function instance, is not
shared across instances, and is not required for correct responses.

The frontend keeps clearly labeled synthetic cached events on proxy failure.
It never changes synthetic provenance into live NASA data. No events are
fabricated; deterministic test fixtures are used only by tests.

P1/P4 coordination: user explicitly authorized scoped proxy wiring in the P4
weather component and P1 Vite config in this chat. No layout, storage, health
models or teammate work was overwritten. No push/deploy is part of this task.

## Previous local proxy verification (2026-10-09)

These results describe the earlier local proxy integration. They do not claim
verification of the Vercel deployment or its newly added function adapter.

- Six proxy/client tests passed: normalization, invalid/empty JSON, safe migration,
  rejected key/rate limit/timeouts, frontend synthetic fallback, HTTP CORS/cache.
- Server TypeScript compilation and frontend production build passed.
- Existing baseline, storage integration and brief contract checks passed.
- Local backend and frontend `/api/space-weather` both returned HTTP 200,
  `source: nasa_donki`, `upstream: nasa_ccmc`, with three validated events.
- Browser rendered the live events and retrieval timestamp. A source/build scan
  verified the configured secret is absent from browser source and artifacts.
- Gateway diagnosis: HTTP 200 + text/html after redirect to CCMC. Live retrieval
  through current CCMC endpoint succeeds; gateway key validity remains unverified.
