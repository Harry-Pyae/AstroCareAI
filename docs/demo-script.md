# ASTROCARE — 2-Minute Demo Script (final)

**Duration**: 2:00 · **Environment**: deployed web app (live URL) · **Backup**: screen recording of this exact flow
**Personas**: Cmdr. Alex Chen (`ac-cmdr-01`, the "change worth reviewing" story) + any stable crew member for contrast

> Judge self-serve path: open the live URL → **Explore demo** → follow the in-app "How this demo works" guide. The script below is the presented version of the same path.

---

## [0:00–0:15] Open — crew selection
- **Action**: Open the live URL. The crew page shows three crew badge cards (name, role, QR code) and the **Explore the judge demo** panel.
- **Say**: *"ASTROCARE is self-monitoring for astronauts: it compares each crew member against their own baseline — not a population average — and explains what changed in plain language. All data here is synthetic, and the app says so on every screen."*

## [0:15–0:30] Enter demo mode
- **Action**: Click **Explore demo** → lands in the *Change worth reviewing* scenario; the demo status chip appears in the top bar.
- **Say**: *"Demo mode runs on three deterministic scenarios, so you can explore every state the system has — including the honest ones."*

## [0:30–1:00] The Baseline Brief (the core)
- **Action**: Open Commander Chen's brief. Point to the Changes-to-Review panel: Sleep ~20% below baseline, HRV ~16% below, both tagged **Worth reviewing**. Expand one row → plain-language explanation + trend chart with the shaded 21-day baseline window.
- **Say**: *"Seven-day average against a personal 21-day reference window. Sleep is 20% below Alex's own normal. Notice the wording — 'worth reviewing.' Never a risk score, never 'unsafe.' The chart's shaded zone is the baseline window, so you can see the comparison, not just trust it."*

## [1:00–1:20] Task context + check-in
- **Action**: Point to the upcoming task card (docking approach, high attention demands). Click **Start check-in**, fill the grouped form (rest / activity / wellbeing), submit → confirmation toast → dashboard updates, "Self-reported today" card appears.
- **Say**: *"Context, not alarms: a high-attention task is coming, so a sleep dip is worth knowing about today. A 30-second check-in feeds the same pipeline immediately."*

## [1:20–1:40] The human decides + honest states
- **Action**: Record **Propose schedule change** with a short note → appears in decision history (aligned columns, timestamps). Switch scenario to *Incomplete information* → dashboard shows insufficient-baseline and stale-data states.
- **Say**: *"The system informs; the astronaut decides — and the decision is logged. And when data is missing or stale, ASTROCARE says exactly that. It never fills gaps with reassuring numbers."*

## [1:40–2:00] Close
- **Action**: Go back to the crew page and point at a badge QR — a phone scan opens that brief directly. Toggle theme (smooth crossfade), flick language to မြန်မာ and back. Point to the synthetic-data footer. Open the top-bar **Demo** button → **Reset this scenario** (select twice to confirm).
- **Say**: *"Bilingual, themed, offline-capable core, zero accounts, fully client-side. ASTROCARE never says 'safe' or 'unsafe' — it says 'worth reviewing,' and keeps the human in command."*

---

## Rules during demo
- Never claim diagnosis, prediction, or clinical validation.
- If the space-weather card shows "(cached)", say: *"live NASA feed with a cached fallback — resilience by design."*
- If anything breaks: Reset demo → continue; worst case, switch to the backup recording without comment.

## Reset for repeat runs
Top-bar **Demo** panel → **Reset this scenario** (restores the selected scenario, touches only demo records).
