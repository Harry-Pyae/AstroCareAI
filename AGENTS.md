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
  styles/tokens.css, components/layout/* (except
  CrewSelectPage.tsx), components/ui/*, index.html,
  AGENTS.md, all merges                                → OWNER: P1 (theme + shell)
  components/layout/CrewSelectPage.tsx,
  components/icons/*, public/ icon assets, docs/       → OWNER: P5 (icons + landing)
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
PPT, submission                                        → OWNER: P5

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
Legacy bridge: DELETED in the polish round. Raw palette classes (gray-*,
neutral-*, amber-*, white, red-*) no longer follow the theme — use tokens.
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
Branch per person from the latest integrated branch P1 names (currently
p1-shell). Small commits. Only P1 merges; polish-round merge order is
P1 → P5 → P2 → P4 → P3. Never force-push.

# POLISH ROUND
## MOTION TOKENS (new — all animation uses these, nothing else)
tokens.css gains:
  --dur-fast: 150ms; --dur-base: 200ms; --dur-slow: 280ms;
  --ease: cubic-bezier(0.2, 0, 0, 1);
Rules: interactive hover/focus/active = --dur-fast; panel/card mount, theme
switch, toast enter/exit = --dur-base; layout-level (nav drawer, column
reflow) = --dur-slow. Everything wrapped in
@media (prefers-reduced-motion: reduce) { * { transition-duration: 0.01ms !important; animation: none !important; } }
No bounces, no parallax, no infinite loops. Motion must read calm.

## ICON SYSTEM (new — one system, delete the other two)
src/components/icons/Icon.tsx is the ONLY icon component. It inlines the
8-icon monotone set (metrics, sleep, heart-pulse, checkin, schedule,
research, spaceweather, qr-scan) plus ui glyphs (menu, close, sun, moon,
arrow, check, copy, download, crew). 24x24, stroke 1.75, currentColor.
Usage: <Icon name="sleep" size={20} /> — color via text-* token classes.
Forbidden: emoji glyphs (the ◆ in TopBar), per-file svg exports (Nav.tsx
icons object), brief/Icon.tsx (delete after migration). Favicon/app icons
live in public/ (favicon.svg, favicon.ico, icon-192.png, icon-512.png) and
are linked in index.html.

## SHARED CONTROLS (new)
src/components/ui/Select.tsx — themed listbox replacing ALL native <select>
(token-styled trigger + popover list, keyboard: arrows/enter/esc/typeahead,
aria-expanded + listbox roles, focus-ring token). Native <select> is now
forbidden in app UI.
src/components/ui/DataList.tsx — aligned record list: a header row of column
titles (text-secondary, 11px uppercase, letter-spacing), grid-template-columns
shared by header and rows, tabular-nums for numeric cells, numeric columns
right-aligned. Used by decision history and any future record lists.

## SPACING CONTRACT (enforced this round)
Section gaps 24px minimum; card padding 20–24px (18px only ≤600px); the
BriefScreen overview header becomes two stacked rows, not one crammed flex
row; right-rail cards separated by 24px. No fixed heights that clip MY text.

## STYLING MIGRATION (end state)
All P2/P4-owned files use token classes directly. The legacy gray/neutral
"ponytail bridge" in tokens.css gets DELETED by P1 at the end of this round —
any file still using gray-*/neutral-*/amber-*/white classes will visibly
break; migrate before the freeze. dashboard.css --brief-* aliases shrink to
only what CSS needs (chart fills); components use Tailwind token classes.

## OWNERSHIP CHANGES THIS ROUND
- CrewSelectPage.tsx + landing polish: P5 (was P1)
- src/components/icons/*, public/ icon assets, docs/: P5
- src/components/ui/Select.tsx + DataList.tsx: P1 builds, everyone consumes
- DecisionHistory.tsx and TaskContextCard.tsx (dead duplicates) were deleted by
  P1; TaskCard.tsx is the one BriefScreen uses. P2 still moves history to DataList.
- public/ app icons + site.webmanifest are in (from astrocare-appicon, linked in
  index.html, used as the sidebar Brand mark). P5 still owns icons/Icon.tsx.
- Backend/PostgreSQL: DO NOT BUILD. If an API layer appears in the repo,
  report to P1; otherwise stay on seeded JSON + localStorage.
Strict git rules (all agents): never push/merge to main, never force-push,
never delete remote branches, never deploy, never edit files you don't own;
coordinate cross-file needs through P1.

