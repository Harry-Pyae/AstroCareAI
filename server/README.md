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

The current integrated work is on `integration/full-local`, based on `cae699b`.
This preparation does not push, deploy, change `main`, or add a database.

## Upstream and errors

The [NASA gateway](https://api.nasa.gov/) documents `/DONKI/FLR`, `/DONKI/CME`,
`/DONKI/GST`, and `/DONKI/SEP`.
[NASA's major-updates notice](https://ccmc.gsfc.nasa.gov/news/major-updates/)
announces the DONKI API change effective 2026-09-30. The
[current FLR reference](https://ccmc.gsfc.nasa.gov/DONKI/api/#tag/events/GET/FLR)
lists `https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR`.

The server uses the key only with the gateway. Redirects are manual. On a
redirect or HTML Content-Type, it calls only the documented CCMC endpoint,
which does not document a key parameter. No key is forwarded there; arbitrary
redirect targets are never followed. Upstream key rejection or rate limits are
not bypassed. CCMC success verifies data connectivity, not gateway key validity.

### Response-schema readiness

FLR identity/time/classification fields are verified and normalized. The official
NASA portal confirms the other three paths and date parameters, but their
primary response schemas could not be retrieved during this inspection. The
implementation therefore accepts genuine empty CME/GST/SEP arrays, and refuses
nonempty responses with explicit `schema_unverified` (503) instead of guessing
identity/time/classification mappings. Their UI and typed transport are ready;
nonempty observation support remains a blocker until the official schema is
available and its fields are verified. Offline client transport fixtures do not
prove that support or current NASA connectivity.

GET `/api/space-weather` returns
`{source, upstream, freshness, fetchedAt, events, categories, partial, window}`.
The legacy `events` list remains solar flares for compatibility. `categories`
separately describes FLR, CME, GST, and SEP, with validated recent events,
the total number of valid unique events returned for the requested window,
per-category retrieval time/source, and safe availability/error information.
Only the three latest events of each type are displayed; the total count is
not the displayed sample size. An empty NASA array is a successful result with
zero events, and unavailable categories never acquire invented observations.
Requests for the four types run concurrently within the existing timeout
budget, rather than four sequential timeout budgets. If only some types
succeed, `partial` is true and the other categories carry explicit safe errors.
If all fail, the endpoint returns an HTTP error with safe per-type failure codes.

`freshness: live` means this response came from a newly successful NASA fetch;
`freshness: cached` means the server reused genuine NASA data from memory.
Cache hits retain the original `fetchedAt`. Synthetic events are never emitted
as a NASA success response. The frontend displays **Live NASA Data**,
**Cached NASA Data**, **Demonstration Data**, or **NASA Data Unavailable**,
and keeps its last genuine retrieval timestamp
across failed retries and crew-card remounts for the current browser session.
That timestamp is not persisted across a full page reload. Failed attempts
update only the separately labeled last-checked time.
FLR's flrID/beginTime/peakTime/classType remain normalized, with optional validated
submissionTime and an HTTPS NASA source link. Classification is shown only
when NASA actually supplies one; no CME/GST/SEP class or health impact is
inferred. The query window is the last 60 days. Empty arrays are valid NASA results. Error
status codes: 503 missing key; 504 timeout; 429 rate limit with bounded Retry-After;
502 rejected key, invalid JSON/schema/content-type or upstream failure. Errors
contain safe codes, never upstream bodies, secret URLs or raw fetch messages.
Upstream responses are bounded to 2MB. Each gateway/CCMC attempt has an 8-second
deadline, including its body read; a migration request can therefore consume up
to 16 seconds. The client allows 22 seconds, and the Vercel function allows 25
seconds. This gives the second fixed NASA endpoint its own attempt budget;
increasing the budget does not establish or repair upstream connectivity.
Successful data
is cached for 60s, concurrent requests coalesce, and failures briefly back off.
On Vercel this cache is best effort within a warm function instance, is not
shared across instances, and is not required for correct responses.

The frontend retains previously retrieved genuine observations as explicitly
cached NASA data when a later request fails, with the failure still visible.
Otherwise it keeps clearly labeled existing synthetic solar-flare events on proxy failure,
with specific fixed messages for timeouts, rate limits, missing configuration,
authorization rejection, invalid responses, and server connection failures.
The labeled retry button respects the bounded `Retry-After` delay; each retry
has a new cancellation controller, and navigating away cancels the request.
The other demonstration categories stay unavailable because no synthetic CME,
GST, or SEP events are supplied. With neither genuine nor demonstration events,
the card displays **NASA Data Unavailable**. It never changes synthetic provenance into live NASA data. No events are
fabricated; deterministic test fixtures are used only by tests.

P1/P4 coordination: user explicitly authorized scoped proxy wiring in the P4
weather component and P1 Vite config in this chat. No layout, storage, health
models or teammate work was overwritten. No push/deploy is part of this task.

## Current connectivity diagnosis (2026-10-09)

The latest production-preparation probes returned these results. They supersede
the earlier successful local retrieval below for current connectivity:

| Probe | Observed result |
| --- | --- |
| Gateway, redirects disabled | HTTP 301, `text/html`, headers after approximately 1.5–2.8 seconds |
| CCMC, 60-day window, Node fetch | `UND_ERR_CONNECT_TIMEOUT` after approximately 10.7 seconds with a 15-second diagnostic deadline; no HTTP headers |
| CCMC, 7-day window, Node fetch | Same connection timeout before HTTP headers |
| CCMC with IPv4-first Node DNS ordering | Same connection timeout |
| CCMC through Windows HTTP | `TaskCanceledException` at 15 seconds |
| DNS | IPv4 A records resolve |
| Updated local proxy and frontend API | HTTP 504 JSON with safe `timeout` code and synthetic-fallback marker after approximately 9.3 seconds |

The immediate failure is establishing a connection to CCMC before a response
arrives. It is not a JSON parser failure, and reducing the requested date window
did not resolve it. The evidence does not identify whether NASA reachability or
this machine's network path is responsible. No current live response was
verified, and gateway key validity remains unknown. A Preview invocation from
Vercel's network is still required to resolve that deployment uncertainty.

The earlier HTTP 200 HTML observation followed the gateway redirect to the
migration page. The proxy continues to handle redirects manually and never
forwards the gateway credential to CCMC.

To reproduce the sanitized local diagnostics from the repository root:

```sh
node --env-file=.env server/diagnose-donki.mjs
node --dns-result-order=ipv4first --env-file=.env server/diagnose-donki.mjs
node --env-file=.env server/diagnose-donki.mjs --all-types
```

These commands print configuration presence, status, content type,
classification, timings, and whitelisted connection codes. They do not print
credentials, sensitive request URLs, raw response bodies, or raw errors. Keep
the existing ignored `.env`; do not copy its contents into reports.

The four-type diagnostic returned gateway HTTP 301 `text/html` for FLR, CME,
GST and SEP after approximately 1.8–2.1 seconds. All four current CCMC requests
then reached their eight-second deadlines before any HTTP headers. The full
concurrent request completed with safe HTTP 504 timeout errors after about
10.2 seconds. No genuine events were retrieved; NASA's actual event counts
are unknown. The restarted local backend, same-origin frontend and emitted
serverless handler also returned valid HTTP 504 JSON with four timeout causes
after approximately 10.3–11.1 seconds. The emitted handler ran locally, not on
Vercel. These real requests are distinct from the passing offline tests.

## Previous local proxy verification (2026-10-09)

Historical results from the earlier local proxy integration follow. They do not
claim current NASA reachability or verification of a Vercel deployment.

- Six proxy/client tests passed: normalization, invalid/empty JSON, safe migration,
  rejected key/rate limit/timeouts, frontend synthetic fallback, HTTP CORS/cache.
- Server TypeScript compilation and frontend production build passed.
- Existing baseline, storage integration and brief contract checks passed.
- Local backend and frontend `/api/space-weather` both returned HTTP 200,
  `source: nasa_donki`, `upstream: nasa_ccmc`, with three validated events.
- Browser rendered the live events and retrieval timestamp. A source/build scan
  verified the configured secret is absent from browser source and artifacts.
- At that earlier check, live retrieval through CCMC succeeded. The gateway
  returned HTTP 200 HTML after a followed redirect; key validity was unverified.
