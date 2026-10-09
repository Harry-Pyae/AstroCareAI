# Dashboard integration

## Full local integration (2026-10-09)

The integrated dashboard uses P1's shared `Select` and `DataList`, P5's shared
`Icon`, and the semantic theme/chart/motion tokens in `styles/tokens.css`.
There is no legacy palette bridge or parallel `--brief-*` color layer.
The overview retains two rows; panel and right-rail sections are at least
24px apart. The disclosure uses the shared motion timing and reduced-motion
rules. All visible labels and explanations consume the English/Myanmar
language provider.

`useCrew`, `useObservations`, and `useTasks` supply the current DemoProvider
data. The dashboard refreshes its scoped stored records when `active`,
`scenario`, or `revision` changes, and resets the mounted crew view so old
scenario observations, decisions, chart selection, and toast state cannot
linger after switching or reset. Real user check-in timestamps are unchanged.
The NASA card keeps the existing same-origin backend and clearly labeled
synthetic fallback; NASA availability never gates the baseline journey.

The formerly duplicated `DecisionHistory`, `TaskContextCard`, `MetricRow`,
`MetricTrendChart`, and local brief `Icon` components have no active imports
and were removed. Decision records retain their `dateTime`, use titled
columns, and render newest first without mutating input history.

The sections below retain the original consolidation audit as historical
context; dependencies described as missing there are now integrated above.

## P2 consolidation audit (2026-10-09)

`p2-complete` starts at `origin/p2-dashboard` (`3ee1aa2`). The complete
`origin/p2-data` history (`1b9d93c`) is already an ancestor, so merging it
reported Already up to date. Both histories are preserved without squashing.
Original P2 data/types/baseline responsibility and the updated P2 dashboard
responsibility were reviewed. No teammate-owned source files were modified.

Fixes: chart inputs now filter by crew ID; failed history refresh clears cached
rows; zero-baseline overview uses the explanation rather than an invented 0%;
the screen supports default and named P1 lazy imports; CSS recognizes current
P1 semantic tokens while retaining old-shell fallback values. Baseline tests
cover exact window edges, the 48h boundary, 15% threshold, invalid/future values,
zero means and unchanged inputs.

Executed: seed tests, real storage integration tests, contract typecheck/build
and server-render checks, and production build. Browser verified chart selection,
check-in changing sleep from 5.84 to 6.11 h, saved decision history, reset,
crew route switching, scientist stale/insufficient states and no console errors.
Dark/light and 390/768/1280 layouts were checked in the isolated contract preview;
390/768 widths had no horizontal document overflow. The original shell on this
P2 base has no theme toggle; the latest theme shell is on `origin/p1-shell`.
React Router emits SSR useLayoutEffect warnings in the test harness.

### Integration requirements for P1

No P3 DemoProvider, scenario files, demo observation selector, scenario clock or
scenario-change subscription exists in the inspected branches. Scenario switching
and reset cannot be tested. Agree with P3 on typed context containing active crew,
observations, task context, comparison time and reset/change notification. Storage
namespace changes must notify the dashboard immediately, rather than waiting for
its minute refresh. P4's latest `feature/person4` adds namespace support; the P4
module already included here supports the shared getters and save signatures,
and real check-in/decision integration passed. Latest P4 namespaces are not
claimed as runtime verified in this branch.

No backend directory, PostgreSQL migrations/schema, backend health API client,
agreed endpoints or API environment configuration exists. Only NASA DONKI fetch
exists. P1 must provide endpoint paths/methods, request/response types for crew,
observations/tasks/decisions/check-ins, errors/pagination, timestamp/provenance
rules, API base URL variable, authentication/CORS policy, demo fallback policy
and local backend startup instructions. The team's PostgreSQL decision supersedes
the old no-backend rule, but there is no implementation to connect yet. Do not
put database credentials or PostgreSQL connections in browser code.

These are dependency blockers, not completed scenario/backend features. P1 can
read this handoff; no message was sent to another person without authorization.
The existing bilingual integration remains on its separate branch.

Demo: http://127.0.0.1:5181/ (synthetic data). Fixed seed time is
2026-10-09T06:00Z; later calendar dates intentionally make observations stale.

`BriefScreen` remains the default component discovered by the existing P1
route loader at `/crew/:crewId`. It consumes the shared types, baseline
function, seed arrays, and P3 storage module through their existing imports.
The shell, storage, seed data, demo time, and route definitions are unchanged.

The overview identifies the astronaut and latest observation, summarizes the
largest flagged percentage change (or incomplete comparisons), and provides
one primary Start check-in action. At 1024px and above, review/trend/support
content and task/decision content form a 2:1 split; smaller widths stack.
Up to four supporting cards prioritize stale/missing readings. The metric
selector and View all comparisons disclosure keep all five metrics available.

## Themes

All rendered dashboard components use semantic `--brief-*` tokens defined in
`dashboard.css`. Light mode is selected by an ancestor `[data-theme="light"]`
or `.light`, or `data-theme="light"` on the dashboard itself. Default is dark.
P1 can provide shared `--surface`, `--surface-subtle`, `--text-primary`,
`--text-secondary`, `--border-color`, `--accent`, `--on-accent`,
`--status-review`, `--status-review-bg`, `--status-neutral`, `--chart-grid`,
`--chart-line`, and `--chart-baseline` tokens. Central light/dark fallbacks
work without changes in individual components. No shell theme switch is added.

## Saved state

`getCheckins(crewId): Observation[]`, `getDecisions(crewId): Decision[]`,
and `saveDecision(decision): boolean` remain the existing storage API.
Check-ins merge with telemetry for comparisons. History refreshes on mount,
window focus, storage events, and every minute. A successful decision write
shows a five-second live confirmation. On return from check-in, a saved
observation timestamp less than two minutes old shows a confirmation once
per crew/timestamp in the running session. This consumes the current save
path without introducing storage writes or changing check-in routing.
Failed decision writes retain the note and show an error.

## Verification

- `npm run build`: full integrated TypeScript and production build.
- `node src/components/brief/integration.test.mjs`: real baseline/storage
  modules, saved observations, decision actions, and failed writes.
- `node src/components/brief/contract.test.mjs`: isolated contract fixtures,
  review-first rendering, freshness/missing states, supporting-card limit,
  no-flag medical-clearance note, unknown crew, and production build.
- `--serve` on the contract test starts a temporary preview at port 4173.
  Theme buttons exist only in that preview, for visual checks; they do not
  modify P1's production shell.

Browser checks cover 1280px and 390px layouts, both dashboard themes, chart
units/axes/tooltip/selector, keyboard focus, decision history, and saved
check-in/decision confirmations.
