# ASTROCARE on Vercel

The React + Vite frontend and optional NASA DONKI enhancement run in one Vercel
project. The frontend keeps requesting `/api/space-weather` on its own origin.
The root `api/space-weather.ts` file exports Node.js Web handlers that reuse
`server/donki.ts` and `server/endpoint.ts`; it does not start a listening server.
The local Node server remains available for development.

The reviewed integration starts at commit `cae699b` on
`integration/full-local`. Deployment preparation stays on that branch; current
preparation edits must be reviewed and committed before a future approved
deployment. This task does not push, deploy, or modify `main`.

No Railway, separate backend host, PostgreSQL, Supabase, authentication service,
or new runtime dependency is needed. Crew records still use the existing
synthetic data and localStorage flows. The persistent synthetic health-data
badge and clearly labeled synthetic space-weather fallback remain in place.

## Project configuration

Use the repository root as Vercel's Root Directory, not `server`, `api`, or
`dist`. The repository's `vercel.json` specifies:

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node.js version | `22.x` via `package.json` engines |
| Function | `api/space-weather.ts` |
| Function maximum duration | 25 seconds |
| SPA fallback | Non-API paths to `/index.html` |

The SPA rewrite source is `/((?!api(?:/|$)).*)`. Its negative lookahead excludes
both `/api` and `/api/*`, so an API request cannot become an HTTP 200 SPA HTML
response. The existing `/api/space-weather` function and static assets retain
their filesystem routes; non-API deep links such as
`/crew/ac-cmdr-01/checkin` use the SPA fallback. An unknown `/api/*` path should
remain a 404 and must be confirmed on the approved Preview.

Each NASA gateway/CCMC attempt has an eight-second deadline, including body
reads. The redirect migration path has at most two attempts, for a maximum
16-second upstream budget. The frontend waits up to 22 seconds and the function
allows 25 seconds. These nested budgets allow a second attempt without the
browser aborting first; they do not prove that NASA is reachable.
Do not replace the API with an external rewrite or expose the upstream NASA
URL in frontend configuration.

Official references: [Node.js functions](https://vercel.com/docs/functions/runtimes/node-js),
[supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions),
[Vite SPA deep links](https://vercel.com/docs/frameworks/frontend/vite), and
[negative-lookahead rewrites](https://vercel.com/docs/project-configuration/vercel-json#negative-lookahead).

## Production and Preview secrets

After permission to configure the intended Vercel project, open its
**Settings > Environment Variables**. Enter `NASA_API_KEY` directly there for
the **Production** and **Preview** environments that are approved to use live
NASA data. Use Vercel's sensitive-value option where available. Never paste the
key into chat, source files, a deployment command, or screenshots.

The function reads `process.env.NASA_API_KEY` on the server. Do not rename it to
`VITE_NASA_API_KEY`, use a `VITE_` prefix for any secret, or add it to Vite's
`define` values. `.env.example` contains placeholders only; local `.env` files
and `.vercel` output stay Git-ignored. Local `.env` is not uploaded as production
configuration. Follow [Vercel environment variable instructions](https://vercel.com/docs/environment-variables)
when adding or changing a value; a new deployment must receive the updated
configuration.

`SERVER_PORT`, `FRONTEND_ORIGIN`, and `API_PROXY_TARGET` are local development
settings. They are not required for this Vercel function. Production and Preview
requests use their actual request URL origin, including custom domains, instead
of a hardcoded localhost or deployment hostname. Cross-origin browser requests
are rejected; no wildcard CORS permission is added. An Origin-free request from
a CLI is allowed.

If `NASA_API_KEY` is missing, the function returns HTTP 503 with a safe code and
the frontend uses its synthetic fallback. The core crew journey still works.

## Local development and checks

Use Node 22.18 or a compatible later Node 22 release. From the repository root,
keep the existing ignored `.env`; copy `.env.example` only when `.env` does not
already exist, then enter the key directly into that local file.

Start the local proxy and frontend in separate terminals:

```sh
npm run dev:server
npm run dev -- --host 127.0.0.1 --port 5181 --strictPort
```

The frontend is at `http://127.0.0.1:5181`; the local proxy is at
`http://127.0.0.1:3001/api/space-weather`. Vite forwards the frontend's relative
API request to the proxy. Configure the local `FRONTEND_ORIGIN` consistently if
using a different host or frontend port. Run only one proxy listener at a time.

Available verification commands:

```sh
npm test
npm run test:brief
npm run build:server
npm run build:function
npm run build
node --env-file=.env server/diagnose-donki.mjs
```

`npm run build` runs TypeScript checks and produces Vite frontend assets.
`build:server` emits the local proxy to ignored `server/dist`.
`build:function` emits the function and imported source modules to ignored
`.vercel/function-check` so their JavaScript imports can be checked and tested.
It is TypeScript artifact validation, not the Vercel CLI's `vercel build`.
The repository tests use deterministic fixtures to exercise success, malformed
responses, timeouts, rate limits, and synthetic fallback; fixtures are never
represented as live NASA responses.

The Vercel CLI is not currently installed and this checkout is not linked to a
Vercel project. Actual `vercel build`, packaging, and cloud runtime validation
have not been executed as part of this preparation. Vite's
static `preview` command also does not emulate the function. Record actual check
results separately; the presence of these commands is not a claim they passed.

## Deployment steps after explicit permission

Preparation does not authorize a push, project import, Preview deployment, or
production deployment. No deployment has been run by this task.

1. Obtain permission for any required commit/push and deployment action. Confirm
   the intended Vercel account/team, project, environment, and reviewed source
   commit from `integration/full-local`. Review and commit the preparation edits
   after permission; obtain separate approval before pushing that branch if
   the chosen workflow requires GitHub. Do not select or modify `main`.
2. In the approved Vercel project, verify the repository Root Directory and the
   settings above. Confirm the selected source branch/commit before triggering
   a build; Git-connected projects can deploy automatically when importing or
   pushing, so perform those actions only after approval.
3. Configure `NASA_API_KEY` directly in the approved Preview/Production
   environment settings. Keep deployment credentials outside the repository.
4. With deployment permission, create an approved Preview deployment of the
   reviewed commit. Verify the build output includes the static `dist` assets
   and the `/api/space-weather` Node function.
5. Test the Preview: load `/`, open and refresh crew and check-in deep links,
   fetch `/api/space-weather` on that same hostname, and verify JSON rather than
   SPA HTML. Confirm `/api/not-a-route` returns 404. Open and refresh both
   `/crew/:crewId` and `/crew/:crewId/checkin` for all six IDs:
   `ac-cmdr-01`, `ac-eng-02`, `ac-sci-03`, `ac-med-04`, `ac-pay-05`, and
   `ac-plt-06`. Confirm crew switching, trend charts, check-in updates,
   decision history, demo scenario/reset isolation, QR deep links, mobile
   navigation, both themes, and both languages. Confirm live events have a
   retrieval timestamp and an empty live event list stays empty.
6. Verify synthetic fallback in an isolated approved Preview with the NASA
   variable omitted or an injected test failure, without printing a key or
   altering production secrets. Confirm health-data provenance remains
   synthetic. Restore the intended Preview configuration for the final check.
7. Production requires separate permission. Confirm its environment variables
   and tested source commit, create the production build/deployment through the
   approved workflow, and promote/assign the production domain only after its
   checks and approval. Do not assume a Preview build uses Production secrets.
8. Repeat same-origin API and deep-link checks on the approved production
   domain. Inspect only sanitized error codes in logs; never print full NASA
   request URLs, raw upstream responses, or credentials.

## NASA behavior and remaining limitations

The earlier gateway diagnosis on 2026-10-09 returned HTTP 200 with
`Content-Type: text/html` after a followed redirect to the migration page.
[NASA's major-updates notice](https://ccmc.gsfc.nasa.gov/news/major-updates/)
announces the DONKI API change effective 2026-09-30. The shared DONKI logic first
uses the documented NASA gateway with the server-only key. It handles redirects
manually; a redirect or non-JSON content type triggers a request only to NASA's
documented fixed CCMC endpoint, with no key forwarded there. Arbitrary redirect
targets are never followed, and key rejection/rate limits are not bypassed.

Current probes returned gateway HTTP 301 HTML after approximately 1.5–2.8
seconds. CCMC requests for both 60-day and 7-day windows failed before HTTP
headers with Node `UND_ERR_CONNECT_TIMEOUT` after approximately 10.7 seconds
under a 15-second diagnostic deadline. IPv4-first ordering produced the same
result; Windows HTTP also timed out at 15 seconds. DNS A records resolve.

This is a connection-before-response failure, not malformed JSON. The evidence
does not distinguish upstream reachability from this machine's network path.
The larger application budget does not claim to fix reachability. No live NASA
response was verified in the current preparation, and gateway key validity is
unknown. Earlier successful CCMC retrieval is historical evidence only; even
that success did not validate the gateway key. See the
[current NASA DONKI FLR reference](https://ccmc.gsfc.nasa.gov/DONKI/api/#tag/events/GET/FLR),
[sanitized current diagnosis](README.md#current-connectivity-diagnosis-2026-10-09),
and [historical local verification](README.md#previous-local-proxy-verification-2026-10-09).

Responses retain the existing normalization, bounded body reads, safe error
codes, request timeout, and rate-limit backoff. Successful results cache for 60
seconds and concurrent requests coalesce only within a warm function instance.
Instances do not share that memory, and restarts/cold starts can discard it;
correctness and synthetic fallback do not depend on persistent cache state.
No database or persistent-cache architecture has been added. The frontend
displays fixed failure explanations and a labeled retry action while preserving
the synthetic fallback. Rate-limit retries respect bounded `Retry-After`.

## Earlier preparation checks (2026-10-09)

- `npm test`: 35/35 passed, including proxy, serverless, client failure/retry,
  fallback, baseline, storage, all-six-crew demo scenarios, and translations.
  The first sandboxed run failed its loopback-socket test (34/35); the complete
  rerun with permitted local network access passed all 35 tests.
- `npm run test:brief`: passed; React Router's existing SSR `useLayoutEffect`
  warnings remain in this isolated contract test.
- `npm run build`, `build:server` and `build:function`: passed.
- Deterministic function/client tests cover success, empty events, safe status
  codes, explicit API-excluding SPA rewrites, same-origin handling, deadlines,
  malformed responses, rate limits, and labeled fallback. Fixture responses
  do not establish live NASA or Vercel cloud connectivity.
- The emitted JavaScript function imported and returned HTTP 200 JSON with an
  offline empty-event fixture. No credential appeared in the response. This
  verifies the compiled handler, not Vercel's packaging or cloud runtime.
- Current local backend (3002) and same-origin frontend (5184) requests returned
  HTTP 504 JSON with `error.code: timeout` and `fallback: synthetic_demo` after
  approximately 9.3 seconds. The browser shows the specific timeout, labeled
  cached synthetic events, and a working retry/loading/recovery control.
- Browser checks passed for all six crew briefs/check-in routes, five chart
  metrics, baseline shading/tooltips/text, task cards, three decision note
  actions, and all three demo scenarios. A crew deep-link reload succeeded.
  Check-in/decision saving and demo reset are covered by the executed storage
  and integration tests; the current browser pass did not write new records.
- English/Myanmar and dark/light combinations at requested viewports 390,
  1024 and 1440 had no horizontal overflow. Chart tokens/shading remained
  present, and the new retry action measured 44px high. Temporary viewport
  overrides were reset. No application JavaScript errors were captured in the
  fresh verification tab.
- `.env` remained ignored; no secret environment files were tracked or staged.
  The actual configured key was absent from tracked files, frontend source,
  and newly generated `dist` assets. No files were staged or committed.
- `npm audit --omit=dev` returned exit 1 with two moderate affected packages
  (`react-router` and `react-router-dom`), and no high/critical findings. npm's
  available fix requires a React Router 7 major upgrade; the agreed Router 6
  stack was preserved. Resolve or explicitly assess this dependency issue with
  P1 before production release. This audit result is separate from the passing
  application tests and builds.
- Vercel CLI packaging, Preview deployment and production checks remain pending.
  No push or deployment was performed during preparation.

## Current real-data and deployed-route verification (2026-10-09)

The current official NASA announcement and linked API reference still specify
`https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR` with the existing JSON schema and
date parameters. The gateway returned HTTP 301 to a NASA host. Direct requests
to the current endpoint for 60 and 7 days, plus the documented legacy endpoint,
timed out before HTTP headers (`UND_ERR_CONNECT_TIMEOUT`, approximately 10.7s
under a 15s diagnostic deadline). The official API reference also timed out in
the local browser. No genuine NASA event data was retrieved in this run.

Local backend and same-origin frontend requests returned HTTP 504, valid JSON,
`error.code: timeout`, and the synthetic-fallback marker. The emitted serverless
handler was also invoked locally with the actual server-side key and real
upstream fetches: HTTP 504 JSON after approximately 9.6s. That was not a Vercel
cloud invocation or a mocked success.

The user-provided [Vercel site](https://astro-care-ai.vercel.app) was tested
without deployment or account changes:

| Route | Observed response |
| --- | --- |
| `/` | HTTP 200, ASTROCARE HTML |
| `/crew/ac-cmdr-01` | HTTP 200, ASTROCARE HTML |
| `/api/space-weather` | HTTP 200, ASTROCARE HTML, not API JSON |
| `/api/unknown` | HTTP 200, ASTROCARE HTML, not API 404 |

The deployed API path is being served as SPA HTML; this is separate from the
local NASA connection timeout. The deployed UI shows cached demonstration data.
It does not prove a successful NASA retrieval. Access to the intended Vercel
project/build is needed to distinguish a missing function from an incorrect
rewrite and to confirm the deployed source commit and Preview/Production
environment. The connected account could not resolve that deployment. The
local corrected API-excluding rewrite has not been deployed.

Current metadata fixes add required `freshness: live|cached` alongside the NASA
source/upstream, preserve cache retrieval times, and validate these fields in
the client. Only a validated fresh success can display **Live NASA data**.
Warm cache and previously retained data during retry display **Cached NASA
data**. Fallback has a synthetic source/label and never borrows NASA retrieval
or event metadata. Last successful retrieval is retained through failures for
the browser session; until actual success the card explicitly says there has
been no successful NASA retrieval in this session. Last checked is separate.

The complete suite passed 39/39; brief contract tests and frontend/server/function
TypeScript checks and builds passed. Tests use explicit offline fixtures for
success/cache/failure cases and are not evidence of current NASA connectivity.
After the last UI wording change, client/translation tests passed 11/11 and the
frontend production build passed. No secrets, pushes or deployments were added.

To complete Preview verification, the project owner must publish the reviewed
integrated function/configuration to an approved Preview, configure its private
`NASA_API_KEY`, then repeat JSON/unknown-API/deep-link checks and confirm genuine
NASA events with their original retrieval timestamp. Do not redeploy the supplied
public alias or promote production without authorization.

## Four-type panel verification and remaining blockers

The expanded panel requests FLR, CME, GST and SEP concurrently using the four
documented gateway paths and fixed current CCMC counterparts. Successful
categories have separate provenance/retrieval times and valid unique totals
before their three-event display limit. A partial success preserves the available
categories and explicitly reports failures. The existing FLR demonstration
fallback remains the only synthetic event set; no CME/GST/SEP data was invented.
The exact English source labels are **Live NASA Data**, **Cached NASA Data**,
**Demonstration Data**, and **NASA Data Unavailable**, with Myanmar translations.
Failed refreshes retain previous genuine observations only as cached NASA data.

The official portal verified endpoint/date parameter formats, but primary
non-FLR response field schemas were not obtained. Nonempty CME/GST/SEP arrays
are intentionally refused as `schema_unverified` (503); genuine empty arrays
remain valid. Do not describe all four types as fully integrated live data until
the documented identity/time fields are verified and normalizers completed.

Real four-type requests returned gateway HTTP 301 HTML followed by CCMC timeouts
before headers. No genuine events of any type were retrieved, so the requested
period's event counts are unknown. The diagnostic completed in about 10.2s;
localhost backend/frontend and the locally emitted serverless handler returned
HTTP 504 valid JSON with all four safe timeout causes in about 10.3–11.1s.
Passing fixtures do not resolve that connection failure.

Verification executed after these changes:

- `npm test`: 52/52 passed, including normalized transport, partial success,
  all-type failures, schema-unverified states, cache/source/time integrity,
  baseline, storage, demo and translation integration.
- `npm run test:brief`: passed after including the shared type-only contract in
  its isolated temporary shell. Existing React Router SSR warnings remain.
- Frontend, local server and Vercel-function TypeScript/production builds passed.
- Browser checks at requested widths 390, 1024 and 1440 in both themes showed
  all four sections, no horizontal overflow, and a 44px retry control. The
  local card explicitly said no successful NASA retrieval in this session.
  No application JavaScript errors were captured; temporary theme/viewport
  changes were restored.

Deployment remains blocked by current NASA reachability, unverified nonempty
CME/GST/SEP response schemas, and the supplied site's API paths returning SPA
HTML. The reviewed local routing/function changes have not been deployed. A
Preview belonging to the intended project/revision and permitted cloud runtime
checks are still needed; the supplied alias's environment/revision is unknown.
Only `NASA_API_KEY` is required in the approved Vercel environment. Local port,
origin and proxy-target settings remain optional development configuration.
No push, deployment, credential change or main-branch modification was made.

### Change inventory and deployment prerequisites

Modified files in this local work: `package.json`, `vercel.json`,
`server/donki.ts`, `server/endpoint.ts`, `server/proxy.test.mjs`,
`server/vercel.test.mjs`, `server/README.md`, `server/VERCEL.md`,
`src/components/brief/contract.test.mjs`,
`src/components/spaceweather/SpaceWeatherCard.tsx`,
`src/components/spaceweather/client.ts`, `src/i18n/en.json` and `src/i18n/my.json`.
New files: `server/space-weather-types.ts`, `server/diagnose-donki.mjs` and
`src/components/spaceweather/client.test.mjs`. The existing
`api/space-weather.ts` entry point is reused without modification. The unrelated
untracked presentation is untouched; astronaut health data and calculations are
unchanged.

Before production approval:

1. Restore access to the current NASA CCMC endpoints and official response
   documentation. Verify the nonempty CME/GST/SEP identity/time/classification
   fields against a primary source, implement their normalizers and execute real
   requests. Report returned event counts and original NASA timestamps;
   mocked fixtures cannot satisfy this step.
2. Identify the intended Vercel project and reviewed source revision. With
   explicit deployment permission, create a Preview of that revision and set
   the private `NASA_API_KEY` in its environment. Do not prefix it with `VITE_`.
   Production requires the same server-only variable separately. No Vercel
   project linkage or cloud environment was changed during this task.
3. In that Preview, verify `/api/space-weather` returns JSON,
   `/api/unknown` returns 404, crew deep links return the SPA, and the browser
   distinguishes fresh genuine responses, cached genuine responses and
   demonstration fallback. Confirm a real successful retrieval timestamp before
   describing the integration as live. Production promotion requires separate
   permission.

Local verification uses frontend `http://127.0.0.1:5184` and backend
`http://127.0.0.1:3002`. These port choices use optional `SERVER_PORT=3002`,
`FRONTEND_ORIGIN=http://127.0.0.1:5184` and
`API_PROXY_TARGET=http://127.0.0.1:3002`; they are not production requirements.
The actual configured key was absent from tracked/new source and generated
frontend assets; no secret environment file is tracked and no file is staged.

## Preview preparation checkpoint — 2026-10-09

The integrated branch `integration/full-local` was fetched/reviewed for the
requested commit and push. At inspection, no remote branch with this name
existed. The unrelated untracked `astrocare.pptx` is excluded. The complete
16-file implementation/test/documentation change set passed review and the
actual configured NASA key was absent from source and generated client assets.
The credential-like link in `server/proxy.test.mjs` is a reviewed dummy rejection
fixture, not a configured credential. `.env` is ignored; only the empty
`.env.example` template is tracked.

All checks were rerun: `npm test` passed 52/52, `npm run test:brief` passed,
and `npm run build`, `npm run build:server` and `npm run build:function` all
exited zero. Existing React Router SSR warnings remain. The real four-type
NASA diagnostic again received gateway 301 HTML and current CCMC timeouts before
headers, returning a safe 504 after approximately 9.4s. No genuine NASA events
were retrieved; scientific event counts remain unknown.

GitHub reports a successful Vercel check for repository
`Harry-Pyae/AstroCareAI` at `390fb2a96b312c1042160df643f7a952ba46ebc4`, linked to
`https://vercel.com/harry-j-s-projects/astro-care-ai/GHu6QPQ9TYfAX41brzf9s4z1E9XA`.
Public GitHub deployment metadata includes both Preview and Production
records, but does not establish the current Production Branch setting or the
environment/revision behind the supplied public alias.

The connected Vercel account still cannot access this project (empty project/team
lists and not-found lookup). Opening
`https://vercel.com/harry-j-s-projects/astro-care-ai/settings/git` initially
required login. After the browser's authenticated dashboard became available,
the owning team's Git settings still displayed **Not Found**. The accessible
dashboard belongs to a different team; project-owner/team access is required.
No authentication, project configuration, deployment or production change was
performed. Since Git pushes can automatically deploy the configured Production
Branch, push remains pending until the owner confirms `integration/full-local`
has no production branch/domain assignment.

To resume safely, the project owner must sign in to the owning Vercel team and
verify Settings → Git: the connected repository is `Harry-Pyae/AstroCareAI`,
the Production Branch is not `integration/full-local`, and this branch is
eligible for Preview builds. Confirm its Preview-only private `NASA_API_KEY`
configuration without sharing the value. Provide project read access or the
confirmed settings and eventual Preview URL. Then normally push only
`integration/full-local`, inspect the resulting deployment's environment/ref/SHA,
and execute the JSON/freshness/genuine-NASA checks above. Production remains
unapproved while NASA connectivity, nonempty non-FLR schemas and actual cloud
function routing are unresolved.
