# Local bilingual integration demo

Branch: `integration/bilingual-demo` (local only, no upstream). Local main remains
`75a7bd104fb27e40909f647495e5047cf4fafefc`. Nothing was pushed or deployed.

## Integration

Verified base: `origin/integration/all-branches` (`b211629`). It already included
main, p2-data and p3-brief. Integrated the missing latest p2-dashboard, p1-shell,
feature/person4 and p5-data contributions. All eight requested remote branches
are ancestors of the local integration HEAD. Kept the new dashboard and latest
check-in screen when resolving conflicts; retained the shell, storage and docs.

## Language coverage

158 English/Myanmar keys cover every active route: crew selection and QR links,
navigation/theme/reset controls, baseline overview and all four statuses,
dynamic explanations/freshness, chart labels/tooltip/reference window, task
titles/demands, decision controls/history/errors, check-in validation and saved
confirmation, NASA DONKI descriptions/fallback, loading/not-found states and
synthetic-data disclaimer. Default is English; the segmented switch updates
without navigation and persists under `astrocare:language`.

Crew proper names, IDs, scientific numbers/units, API fields, URLs and user-entered
notes remain intact. No known missing keys on mounted UI. Unmounted legacy
components are retained. Digital twin, risk scoring, AI recommendations, scenario
controls, search and settings are not implemented in this repository and were
not invented.

Noto Sans Myanmar is bundled locally with its OFL license in `src/assets/fonts`.
Source: Google Fonts repository, `ofl/notosansmyanmar`. Myanmar month labels use
explicit translations so browsers with limited ICU locale data also render them.

## Validation and demo

- Production TypeScript/Vite build passed.
- Seed baseline tests passed (all statuses, deltas, zero baseline, purity).
- Real storage integration tests passed (check-in baseline update, all decisions,
  sorted history, crew isolation, failed writes).
- Contract fixture typecheck/build/server-render assertions passed. React Router
  emits expected useLayoutEffect warnings in this SSR-only test.
- Translation tests passed: dictionary parity, placeholders, active JSX labels,
  dynamic seed roles/tasks and all baseline status explanations.
- Browser: English default, Myanmar immediate switch and refresh persistence;
  crew routes, trend selection, stale/insufficient states, decision persistence,
  check-in validation/save confirmation and keyboard fatigue selection passed.
  Form values and user note remain when changing language.
- Checked dark/light Myanmar at mobile 390px without horizontal overflow and
  desktop layout. Fresh browser run had no console errors; React Router v7
  migration warnings remain in development mode.

Run `npm run dev -- --host 127.0.0.1 --port 5180 --strictPort`.
Open http://127.0.0.1:5180/ and use EN / မြန်မာ in the top bar. Select Alex Chen
for flagged HRV/sleep, Sam Rivera for within-range values, Maya Patel for stale
radiation and insufficient mood observations. Use Start check-in or the decision
buttons to test saves. NASA is optional; cached demonstration events were
verified, live retrieval is not guaranteed. Seed timestamps are fixed to
2026-10-09 and will become stale on later dates.
