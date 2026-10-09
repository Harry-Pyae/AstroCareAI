# AGENTS.md — ASTROCARE

## What this project is
ASTROCARE: Baseline Brief — astronaut health self-monitoring web prototype for a
hackathon practice round. A crew member checks in, compares recent health
indicators against their own personal baseline, reads a plain-language
explanation, sees upcoming task context, records a decision, and can be reached
via QR deep link. All health data is SYNTHETIC and labeled as such.

## Hard rules (every agent, every file)
- NEVER generate code that diagnoses, predicts health outcomes, computes a
  "risk score", or labels anyone "safe"/"unsafe" for a task. Neutral wording
  only: "change worth reviewing", "within personal baseline range".
- All seeded values are "illustrative demo settings", never clinical thresholds.
- The core user journey must work with NO external API. The DONKI space-weather
  card is an optional enhancement with a cached-JSON fallback.
- A persistent footer badge reads: "Synthetic demonstration data — not medical
  advice." Do not remove it.
- No authentication, no backend database, no model training, no chatbot.

## Stack (fixed — do not add dependencies beyond these)
- React 18 + Vite + TypeScript, react-router-dom
- Tailwind CSS
- Recharts (charts), qrcode (QR generation), html5-qrcode (optional scanner)
- State: React context + localStorage. No Redux, no server.
- Deploy: Vercel. `vercel.json` must contain the SPA rewrite:
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }

## Folder structure & ownership (do not edit files you don't own)
src/
  App.tsx, main.tsx, routes.tsx, components/layout/*   → OWNER: P1 (shell)
  data/crew.json, data/observations.json,
  data/tasks.json, data/spaceweather-fallback.json,
  lib/baseline.ts, lib/types.ts                        → OWNER: P2 (data+logic)
  screens/BriefScreen.tsx, components/brief/*          → OWNER: P3 (main UI)
  screens/CheckinScreen.tsx, components/checkin/*,
  lib/storage.ts, components/qr/*,
  components/spaceweather/*                            → OWNER: P4 (checkin/QR/DONKI)
docs/ (pitch, references, demo script)                 → OWNER: P5 (no code)

## Shared data contracts (lib/types.ts — P2 commits this in the first 15 min;
## everyone else codes against it, changes only via P1)
interface CrewMember { id: string; name: string; role: string; }
interface Observation { crewId: string; metric: "hrv"|"sleep_hours"|
  "exercise_min"|"radiation_msv"|"mood"; value: number; timestamp: string;
  provenance: "synthetic_telemetry"|"user_checkin"; }
interface BaselineResult { metric: string; baselineMean: number;
  baselineWindowDays: number; currentMean: number; currentWindowDays: number;
  deltaPct: number|null; status: "within_range"|"worth_reviewing"|
  "insufficient_data"|"stale_data"; explanation: string; }
interface Decision { crewId: string; action: "recheck"|"request_review"|
  "propose_schedule_change"; note: string; timestamp: string; }
interface TaskContext { crewId: string; title: string; scheduledFor: string;
  attentionDemands: string[]; }

## Baseline logic contract (lib/baseline.ts)
computeBaselines(observations, crewId, now) → BaselineResult[]
- Baseline window: days 28→8 before now. Current window: last 7 days.
- Minimum 5 baseline observations per metric, else "insufficient_data".
- Newest observation older than 48h → "stale_data".
- "worth_reviewing" when |deltaPct| ≥ 15 (illustrative demo setting).
- Pure function, no side effects, unit-testable.

## Routes
/                     → crew selection (badge cards with QR)
/crew/:crewId         → BriefScreen (the main screen)
/crew/:crewId/checkin → CheckinScreen

## Integration checkpoints (Yangon time)
- +0:15  P2's types.ts + seed JSON committed. Everyone pulls.
- +1:15  First end-to-end: route → brief renders seeded data. P1 verifies.
- +2:15  FEATURE FREEZE. Only bugfixes. P1 deploys to Vercel.
- +2:40  Demo rehearsal on the DEPLOYED URL. P5 leads.
- Cut order if late: html5-qrcode scanner → DONKI live fetch (keep fallback
  card) → decision history list → mood metric.

## Git discipline
Branch per person (p1-shell, p2-data, p3-brief, p4-checkin). Small commits.
P1 merges to main at each checkpoint. Never force-push main.
