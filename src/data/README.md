# Synthetic demonstration data

All health values and fallback solar flare events are fictional illustrative demo settings, not clinical thresholds or live NASA records. The fixed fixture reference is 2026-10-09T06:00:00.000Z (12:30 PM Yangon). Runtime datasets move synthetic timestamps and task times together to the current session reference; user-checkin timestamps remain unchanged.

Six seeded crew profiles:

- ac-cmdr-01, Alex Chen: sleep -20% and HRV -16%, both changes worth reviewing.
- ac-eng-02, Sam Rivera: all five metrics within personal baseline range.
- ac-sci-03, Maya Patel: only three baseline mood readings, so insufficient data.
- ac-med-04, Lena Okafor: HRV and radiation newest readings three days and one hour old.
- ac-pay-05, Kenji Sato: exercise +25%, a change worth reviewing.
- ac-plt-06, Sofia Marquez: mood -18% and stale exercise readings.

Each metric normally has 35 daily observations. Profiles represent missing readings by omission, never fabricated zeros. Every crew has one upcoming task. The stable scenario has all metrics within range; the incomplete scenario supplies at least one missing or stale metric for each crew. These states are descriptive comparisons, never medical clearance.

profiles.ts is the source shared by the runtime scenarios and generate-seeds.mjs. dataset.ts preserves the JSON fixtures while shifting synthetic dates; scenarios/index.ts builds deterministic profile values against the provider's session anchor. The original fixture timestamps remain reproducible.

Baseline windows are [now - 28 days, now - 7 days) for the 21-day baseline and [now - 7 days, now] for the current window. Invalid, non-finite, and future readings are excluded. Fewer than five baseline readings or no current readings produces insufficient_data first. Otherwise, a newest reading older than 48 hours produces stale_data. A zero baseline has deltaPct:null; equal zeros stay within range and a change from zero is worth reviewing.

Regenerate fixtures:

```sh
node src/data/generate-seeds.mjs
```

Run assertions (Node 22.18+):

```sh
node src/data/baseline.test.mjs
node --test src/components/demo/demo.test.mjs src/lib/storage.test.mjs
```
