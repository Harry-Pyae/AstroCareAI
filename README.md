# ASTROCARE — Baseline Brief

**Astronaut health self-monitoring that compares each crew member with their own personal baseline.**

> **Live demo:** _https://astro-care-ai.vercel.app_
>
> All health data in this prototype is **synthetic** and labelled as such. It is **not medical advice** and does not diagnose, predict, score risk, or label anyone "safe" or "unsafe".

---

## Judge quick start (about 60 seconds)

1. **Open the live URL.** You land on **Crew selection**: six crew members, each with data freshness and a neutral count of changes (never a score).
2. Select **Explore demo**. Demo mode starts in the *Change worth reviewing* scenario and opens **Alex Chen's** brief. The top bar now shows a **Demo** button.
3. Read **Changes to review**: sleep is about 20% and HRV about 16% below Alex's own 3-week baseline. Below it, the **Baseline vs recent trend** chart shades the baseline period.
4. Note the **Upcoming task context** card (docking approach monitoring, high attention demands).
5. Select **Start check-in**, fill in Rest / Activity / Wellbeing, and save. Back on the brief, the recent averages update and the **Self-reported today** card shows what you entered.
6. Under **What would you like to do?**, record **Recheck**, **Request review** or **Propose schedule change**. It appears in the decision history.
7. Open the top-bar **Demo** button to switch to **Stable observations** or **Incomplete information**. Every screen updates. **Reset this scenario** restores the starting point (select twice to confirm).
8. Optional: on a brief, select **Crew badge** to show its QR code (plus Copy link / Download PNG). Scanning it with a phone opens that brief directly. Try the **Light/Dark theme**, **EN / မြန်မာ** and **Collapse sidebar** controls.

Need help in the app? Select **How this demo works** on the crew page or in the Demo panel for a 4-step guide.

## What it does

| Feature | What you see |
|---|---|
| Personal baseline brief | For each metric (HRV, sleep, exercise, radiation, mood), the last 7 days' average is compared with that person's own 3-week baseline (days 28–8). |
| Neutral status | *Within personal baseline range*, *Change worth reviewing* (±15% or more, an **illustrative demo setting, not a clinical threshold**), *Insufficient data* (fewer than 5 baseline readings), *Stale data* (newest reading over 48 hours old). Status always has an icon and text, never color alone. |
| Plain-language explanations | Every comparison is explained in a sentence, e.g. "Average sleep over the last 7 days (5.84 h) is 20% below this crew member's 3-week baseline (7.3 h). Change worth reviewing." |
| Daily check-in | Sleep hours and quality, fatigue, exercise and effort, water intake, mood, stress, symptoms and a note. Sleep, exercise and mood join the baseline comparison. Everything else is shown as recorded, never interpreted. HRV and radiation stay synthetic telemetry and cannot be entered by hand. |
| Task context and decisions | Upcoming task with its attention demands, and three human-in-command actions with a saved history. |
| Demo mode | Three synthetic scenarios (*Stable observations*, *Change worth reviewing*, *Incomplete information*). Demo records are kept separate from your own check-ins. |
| Space weather context | Recent solar flares from **NASA DONKI** (live via NASA CCMC, with a clearly labelled cached fallback). Context only: never linked to anyone's readings. |
| Crew overview | Six synthetic crew profiles (stable, declining, incomplete, stale, exercise increase, mixed), each with freshness and counts of changes; counts only, never a health rating. |
| QR deep links | **Crew badge** on each brief opens the QR code, link copy and PNG download, so personal links are shared only on purpose. |
| Accessibility and polish | Light/dark themes, English and Myanmar, keyboard navigation with visible focus, reduced-motion support, works from phone to desktop. |

## Honest limitations

- **Synthetic data only.** No real astronaut data is used. Timestamps are shifted to "now" when the app loads, so the demo always shows its designed statuses.
- **Illustrative thresholds.** The 15% / 5-reading / 48-hour rules are demo settings, not clinically validated.
- **No clinical validation, no backend.** Records are saved only in this browser (localStorage). There are no accounts and no server database.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check (tsc) + production build into dist/
```

Tests (no extra dependencies):

```bash
node src/data/baseline.test.mjs               # baseline rules and seed profiles
node src/components/brief/integration.test.mjs # storage + baseline integration
node src/components/brief/contract.test.mjs    # dashboard render contract + build
node src/i18n/i18n.test.mjs                    # English/Myanmar coverage
```

Configuration is optional: see `.env.example`. `VITE_DONKI_FLR_URL` overrides the NASA DONKI endpoint. No API key is needed.

## Deployment (Vercel)

Framework preset **Vite**, build command `npm run build`, output directory `dist`. `vercel.json` contains the single-page-app rewrite so deep links such as `/crew/ac-cmdr-01` (and QR scans) open directly.

## Tech stack

React 18 · Vite · TypeScript · Tailwind CSS v4 · React Router · Recharts · qrcode. Synthetic crew profiles in `src/data/profiles.ts` (regenerate fixtures with `node src/data/generate-seeds.mjs`), the baseline logic in `src/lib/baseline.ts` (a pure, unit-tested function), browser storage in `src/lib/storage.ts`. No server is needed: NASA DONKI is fetched directly from the browser.

## More

- `docs/demo-script.md`: 2-minute presented demo
- `docs/pitch.md`: pitch and answers to likely judge questions
- `docs/references.md`: NASA research and data sources
