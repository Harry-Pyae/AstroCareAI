# ASTROCARE on Vercel

The React + Vite frontend and optional NASA DONKI enhancement run in one Vercel
project. The frontend keeps requesting `/api/space-weather` on its own origin.
The root `api/space-weather.ts` file exports Node.js Web handlers that reuse
`server/donki.ts` and `server/endpoint.ts`; it does not start a listening server.
The local Node server remains available for development.

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
| Function maximum duration | 15 seconds |
| SPA fallback | `/(.*)` to `/index.html` |

The NASA request timeout remains a total eight seconds, within the configured
function duration. Vercel's filesystem/function routing takes precedence over
the SPA rewrite: `/api/space-weather` invokes the function, static assets remain
static, and deep links such as `/crew/ac-cmdr-01/checkin` serve the React app.
Do not replace the API with an external rewrite or expose the upstream NASA
URL in frontend configuration.

Official references: [Node.js functions](https://vercel.com/docs/functions/runtimes/node-js),
[supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions),
[Vite SPA deep links](https://vercel.com/docs/frameworks/frontend/vite), and
[rewrite precedence](https://vercel.com/docs/project-configuration/vercel-json#rewrites).

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
```

`npm run build` runs TypeScript checks and produces Vite frontend assets.
`build:server` emits the local proxy to ignored `server/dist`.
`build:function` emits the function and imported source modules to ignored
`.vercel/function-check` so their JavaScript imports can be checked and tested.
It is TypeScript artifact validation, not the Vercel CLI's `vercel build`.
The repository tests use deterministic fixtures to exercise success, malformed
responses, timeouts, rate limits, and synthetic fallback; fixtures are never
represented as live NASA responses.

The Vercel CLI is not currently installed. Actual Vercel packaging and cloud
runtime validation have not been executed as part of this preparation. Vite's
static `preview` command also does not emulate the function. Record actual check
results separately; the presence of these commands is not a claim they passed.

## Deployment steps after explicit permission

Preparation does not authorize a push, project import, Preview deployment, or
production deployment. No deployment has been run by this task.

1. Obtain permission for any required commit/push and deployment action. Confirm
   the intended Vercel account/team, project, environment, and reviewed source
   commit on `p2-complete`. Do not select or modify `main` by default.
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
   SPA HTML. Confirm live events have a retrieval timestamp and an empty live
   event list stays empty. Confirm decisions/check-ins and both themes still
   work.
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
`Content-Type: text/html` after redirecting to CCMC. The shared DONKI logic first
uses the documented NASA gateway with the server-only key. It handles redirects
manually; a redirect or non-JSON content type triggers a request only to NASA's
documented fixed CCMC endpoint, with no key forwarded there. Arbitrary redirect
targets are never followed, and key rejection/rate limits are not bypassed.

Successful CCMC data retrieval proves connectivity and validated data, not the
gateway key's validity. That limitation remains until the gateway can validate
the key. See the [current NASA DONKI FLR reference](https://ccmc.gsfc.nasa.gov/DONKI/api/#tag/events/GET/FLR)
and the previous [local proxy verification](README.md#previous-local-proxy-verification-2026-10-09).

Responses retain the existing normalization, bounded body reads, safe error
codes, request timeout, and rate-limit backoff. Successful results cache for 60
seconds and concurrent requests coalesce only within a warm function instance.
Instances do not share that memory, and restarts/cold starts can discard it;
correctness and synthetic fallback do not depend on persistent cache state.
No database or persistent-cache architecture has been added.

## Executed preparation checks (2026-10-09)

- `npm test`: 13/13 passed, including proxy, serverless, fallback, baseline and
  storage integration checks. Local socket tests required sandbox network access.
- `npm run test:brief`: passed; React Router's existing SSR `useLayoutEffect`
  warnings remain in this isolated contract test.
- `npm run build`, `build:server` and `build:function`: passed.
- The emitted function imported successfully and returned the expected JSON
  envelope with an offline empty-event fixture. This was not a cloud invocation.
- The configured local NASA key was absent from `src` and frontend `dist` assets;
  `.env` remained ignored and no secret environment file was tracked.
- Vercel CLI packaging, Preview deployment and production checks remain pending.
  No push or deployment was performed during preparation.
