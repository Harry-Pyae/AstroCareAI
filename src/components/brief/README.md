# P3 integration

`BriefScreen` exports a default component discovered by P1's existing screen
route loader. It reads `crewId` from `/crew/:crewId`, imports shared types and
`computeBaselines` directly from `src/lib`, and imports the three seed JSON
arrays. It uses the actual current time; fixed seed data can become stale.

Expected P4 storage API:

```ts
getCheckins(crewId: string): Observation[]
getDecisions(crewId: string): Decision[]
saveDecision(decision: Decision): void
```

Check-ins are merged with telemetry before comparison. Local history refreshes
on mount, window focus, storage events, and every minute. Decisions save with
the current timestamp and display newest first. A crew route change resets
the form and component state. The P1 layout supplies the persistent synthetic
data footer; P3 does not duplicate it.

Run `node src/components/brief/contract.test.mjs` after installing the existing
dependencies. The test creates a temporary integration tree with contract
fixtures, typechecks it, builds the SPA, and checks server-rendered routes and
edge states. `--serve` also starts the fixture preview on port 4173 for manual
interaction checks. This verifies P3 against the contract; full integration
with the real P2/P4 modules still needs P1's merge.

Browser checks with fixtures: all three decision actions open a note form and
save; history stays after reload and sorts newest first; review details toggle;
the reference window is visibly shaded; the dark theme fits a narrow viewport.
