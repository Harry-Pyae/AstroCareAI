# Synthetic demonstration data

All values and solar flare events are fictional illustrative demo settings,
not clinical thresholds or live NASA records.

The reproducible demo reference time is `2026-10-09T06:00:00.000Z`
(12:30 PM Yangon). Call `computeBaselines(observations, crewId, now)` with
that time to reproduce the intended statuses. Using a later real time will
naturally make this fixed fixture stale or insufficient.

- `ac-cmdr-01`: recent sleep averages 5.84 h versus 7.3 h (-20%); HRV
  averages 42 ms versus 50 ms (-16%). Both are changes worth reviewing.
- `ac-eng-02`: all five metrics are within personal baseline range.
- `ac-sci-03`: mood has only three baseline readings; the newest radiation
  reading is three days and one hour old. Other metrics remain within range.

Each metric normally has 35 daily readings. The scientist's two intentional
exceptions produce 497 observations in total. Commander docking monitoring
is scheduled 24 hours after the reference time.

Baseline windows use elapsed time: `[now - 28 days, now - 7 days)` for the
21-day baseline and `[now - 7 days, now]` for the current window. Invalid,
non-finite, and future readings are excluded. Fewer than five baseline
readings or no current readings yields `insufficient_data` first. Otherwise
a newest reading older than 48 hours yields `stale_data`. A zero baseline
has `deltaPct: null`; unchanged zero values remain within range and a change
from zero is worth reviewing. Constant nonzero baselines need no variance
division and use the ordinary percentage comparison.

Regenerate fixtures: `node src/data/generate-seeds.mjs`.
Run assertions (Node 22.18+): `node src/data/baseline.test.mjs`.
