# Dashboard integration

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
