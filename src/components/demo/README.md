# Integrated synthetic demo

DemoProvider is the shared source for all screens. The six-crew profiles in data/profiles.ts generate stable, reviewing, and incomplete observations and upcoming tasks against one session anchor. Every comparison runs through computeBaselines; precomputed standalone mock baselines are not used.

The provider exposes dataset/data and version/revision compatibility aliases, plus typed crew, observation, and task hooks. Enter, switch, reset, and exit bump the revision so Brief and Checkin remount their scenario-specific state. DemoMenu supplies scenario controls in the top bar and DemoGuideProvider supplies the four-step guide. The older control-panel export remains compatible but is not mounted as a duplicate global panel.

Synthetic dates are anchored with the latest reading one hour before the reference. Personal user_checkin dates are never moved. Normal records use astrocare:v1:state and demo records use demo:astrocare:v1:state. Enter/switch/reset clear only the demo envelope; exit restores normal records. A failed reset leaves the current scenario and records unchanged, with an honest message.

The canonical selection key is demo:astrocare:mode. The old demo:active_scenario envelope or plain scenario string is accepted, including review -> reviewing migration. Selection/namespace initialization completes before child screens read storage on reload.

Run:

```sh
node --test src/components/demo/demo.test.mjs src/lib/storage.test.mjs src/data/baseline.test.mjs
```

The regression checks cover all six crews on a future clock, personal-record isolation, selection migration, reset failure, exact five-minute duplicate boundaries, v1-to-v2 additive migration, atomic multi-metric check-ins, and preserving genuine check-in dates.
