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
- Tailwind CSS v4 (CSS-first config: there is NO tailwind.config.js — theme
  tokens are mapped to classes in src/styles/tokens.css via `@theme inline`)
- Recharts (charts), qrcode (QR generation), html5-qrcode (optional scanner)
- State: React context + localStorage. No Redux, no server.
- Deploy: Vercel. `vercel.json` must contain the SPA rewrite:
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }

## Folder structure & ownership (REDESIGN phase — do not edit files you don't own)
src/
  App.tsx, main.tsx, routes.tsx, index.css, theme.tsx,
  styles/tokens.css, components/layout/*, index.html,
  AGENTS.md, all merges                                → OWNER: P1 (theme + shell)
  screens/BriefScreen.tsx, components/brief/*,
  dashboard pieces of the home route                   → OWNER: P2 (dashboard)
  lib/demo.ts, data/scenarios/*, components/demo/*,
  DemoProvider context                                 → OWNER: P3 (demo mode)
  screens/CheckinScreen.tsx, components/checkin/*,
  lib/storage.ts, components/qr/*,
  components/spaceweather/*, i18n/*                    → OWNER: P4 (polish + QA)
  data/crew.json, observations.json, tasks.json,
  spaceweather-fallback.json, lib/baseline.ts,
  lib/types.ts                                         → FROZEN: change only via P1
docs/, PPT, submission                                 → OWNER: P5 (no code)

## Theme tokens (src/styles/tokens.css — style ONLY with these, never hex or
## raw palette classes like gray-800 / amber-400)
Theme = data-theme="dark|light" on <html>. useTheme() from src/theme.tsx gives
{ theme, toggleTheme }. Both themes define every token below.
| Token (CSS var)       | Tailwind class               | Use                                 |
|-----------------------|------------------------------|-------------------------------------|
| --page                | bg-page                      | page background                     |
| --card                | bg-card                      | card / panel surface                |
| --card-raised         | bg-card-raised               | hover, nested surface, chips        |
| --text-primary        | text-primary                 | headings, values, body              |
| --text-secondary      | text-secondary               | labels, captions, placeholders      |
| --border-default      | border-default               | card + input borders                |
| --border-strong       | border-strong                | hover / emphasized borders          |
| --accent              | bg-accent, text-accent       | primary action, selected state      |
| --on-accent           | text-on-accent               | text on bg-accent                   |
| --accent-review       | text-accent-review, bg-accent-review/15 | "worth reviewing" (amber) |
| --danger              | text-danger                  | existing urgent states ONLY         |
| --focus-ring          | outline-focus-ring           | focus (global :focus-visible ring)  |
| --chart-line          | stroke="var(--chart-line)"   | Recharts series                     |
| --chart-grid          | stroke="var(--chart-grid)"   | Recharts CartesianGrid              |
| --chart-label         | fill="var(--chart-label)"    | Recharts axis ticks                 |
| --chart-tooltip-bg    | contentStyle background      | Recharts tooltip                    |
| --chart-baseline-fill | fill="var(--chart-baseline-fill)" | shaded baseline window (ReferenceArea) |
Opacity modifiers work on all color classes (bg-accent/15, border-accent-review/40).
Spacing 4/8/12/16/24/32/48px, card padding 20–24px, touch targets ≥44px (min-h-11).
Never communicate state by color alone. prefers-reduced-motion is handled globally.
Breakpoints: sidebar is icons-only ≤1024px and a hamburger sheet <768px (md).
Legacy bridge: tokens.css temporarily remaps gray/neutral/amber/white/red-400
classes onto tokens so un-migrated screens theme correctly — do not rely on it;
it is deleted once P2/P4 migrate.
Shell slots: the top bar shows a placeholder "Synthetic data" chip until P3's
DemoProvider chip merges; the language switch renders only with full
translations from P4. localStorage key "astrocare:theme" belongs to theme.tsx
(the one exception to "only storage.ts touches localStorage").

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
