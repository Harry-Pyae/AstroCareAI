# Integrated baseline dashboard

The dashboard combines the complete P2 baseline/data work with P1 shared
controls, P5 icons, P3 DemoProvider and P4 check-in, QR and weather capabilities.
The six synthetic crew profiles are selectable through the shared shell.
All health information remains clearly marked as demonstration data.

## Dashboard behavior

- The two-row overview identifies the selected astronaut, latest observation,
  last check-in and the most relevant baseline change. Start check-in is the
  primary action; the crew badge dialog supports copying/downloading a QR.
- Changes to review precedes the trend chart. The chart shades the personal
  baseline window, displays unit-aware axes/tooltips and has a text explanation.
  Supporting cards prioritize stale or missing observations; all five metrics
  remain reachable through the disclosure and accessible shared Select.
- Task context stays neutral. Decision actions record a note locally and show
  Action, Note and Recorded columns, with newest first and dateTime preserved.
- SelfReportCard shows the latest valid self-report for this crew member,
  including sleep, fatigue, activity, mood, stress, hydration, symptoms and note.
  It displays freshness and an empty-state check-in action. Supplemental fields
  are shown as recorded and never compared or interpreted.
- The optional NASA card uses the same-origin API proxy, with a clearly labeled
  synthetic fallback. NASA availability does not gate the core journey.

## Integration and themes

useCrew, useObservations and useTasks consume DemoProvider data. Active mode,
scenario and revision changes remount the crew view and refresh scoped records,
so old decisions, check-ins, selected metric and toast state cannot linger.
Synthetic telemetry/tasks are rebased through the provider; real check-in
timestamps are retained.

All brief components use the semantic theme/chart tokens directly. Both themes
share the same layout. There is no raw palette bridge or parallel color alias
layer. Section and right-rail gaps are at least 24px, card padding is 24px
(18px on small screens), and the overview stacks naturally at 600px.
Motion uses the shared durations and reduced-motion rule.
Labels and dynamic explanations consume the English/Myanmar language provider.

The unused local Icon, DecisionHistory, TaskContextCard, MetricRow and
MetricTrendChart duplicates were removed after confirming no active imports.
Original P2 branch histories and consolidation audits remain recoverable in Git.

## Verification

- npm run build: integrated TypeScript and production build.
- node src/components/brief/integration.test.mjs: real storage/baseline,
  multi-metric saves, duplicate guard, telemetry-only HRV, old record support,
  sorted crew history and failed writes.
- node src/components/brief/contract.test.mjs: isolated fixture typecheck/build,
  rendered crew routes/status states, shared metric listbox, decision columns
  and dateTime, self-report crew/future isolation, freshness and empty actions.
  The SSR harness uses the real language and demo providers. React Router
  emits its expected useLayoutEffect server-render warnings.

The original P2 data contract and pure baseline calculation remain in src/lib.
No medical conclusions or risk scores are added by the self-report UI.
