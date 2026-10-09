# ASTROCARE 2-Minute Live Demo Script

**Target Duration**: 2 minutes (120 seconds)  
**Target Environment**: Deployed web application  
**Primary Persona**: Commander Alex Chen (`ac-cmdr-01`)  
**Design Elements Covered**: Demo-mode entry, scenario switching, themed controls (light/dark + EN/MY), personal baseline brief, check-in, decision bar, and contextual telemetry.

---

## Demo Timeline & Spoken Script

### [0:00 – 0:20] Step 1: Crew Landing, Themed Controls & Demo-Mode Entry
- **Action**: Open the deployed website homepage (`/`) in Light theme. Point out the top-bar controls: Theme toggle (Light/Dark) and Language switcher (English / Myanmar). Click the theme toggle to demonstrate instant token transition to Dark mode, then back to Light.
- **Presenter**:
  > *"Welcome to ASTROCARE. In deep space, astronaut autonomy begins with rapid self-monitoring. Our landing screen presents each crew member with their role, baseline metric count, and a deep-link badge QR code. Notice our top-bar controls: seamless light/dark theming and full English–Myanmar bilingual support, built entirely on CSS-first tokens.
  > Let's enter directly via the 'Explore demo' action, which brings us straight into Commander Alex Chen's profile under an active mission review scenario."*
- **Action**: Click the **"Explore demo"** button on the landing page, or scan / click Commander Alex Chen (`ac-cmdr-01`) to land on `/crew/ac-cmdr-01`.

---

### [0:20 – 0:45] Step 2: Personal Baseline Comparison & Shaded Trend Chart
- **Action**: On Commander Chen's brief screen, point out the demo chip in the top bar and the personal baseline comparison table.
- **Presenter**:
  > *"Notice the 'Demo — synthetic data' status in the header. ASTROCARE never compares an astronaut against static population norms. Instead, it compares Alex's recent 7 days against his own 21-day personal reference baseline.
  > In this scenario, while exercise and radiation remain steady, Sleep Hours is down 20% (5.8 hours vs. 7.3-hour baseline) and HRV has decreased 16% (42 ms vs. 50 ms). Both are flagged neutrally with an amber badge as 'Worth reviewing'.
  > Expanding details reveals clear, plain-language explanations alongside an interactive Recharts trend chart, where the shaded window clearly identifies Alex's personal baseline period."*
- **Action**: Expand "Show details" on Sleep Hours or HRV to display the plain-language explanation and chart with shaded baseline area.

---

### [0:45 – 1:05] Step 3: Upcoming Task Context & Scenario Switching
- **Action**: Scroll to the Task Context card, then briefly highlight scenario controls.
- **Presenter**:
  > *"Immediately below the vitals, the Task Context card highlights Alex's upcoming operational milestone: 'Docking approach monitoring' in 24 hours, demanding sustained attention and fine motor control. The connection between fatigue and operational safety is immediately obvious.
  > If we switch scenarios in our demo controls—for example, to 'Incomplete information'—the dashboard updates instantly and honestly, surfacing missing baseline readings or stale telemetry rather than fabricating false reassurance."*
- **Action**: Point out the task demands, and demonstrate the scenario toggle (e.g. from reviewing to stable or incomplete, then back to reviewing).

---

### [1:05 – 1:25] Step 4: Submitting a Live Check-in
- **Action**: Click "Add check-in →" (or "Start check-in") to open `/crew/ac-cmdr-01/checkin`.
- **Presenter**:
  > *"A crew check-in takes under 30 seconds. Let's record a morning entry: 6.0 hours of sleep, a fatigue rating of 3 out of 5, and an optional note: 'Restless rest cycle'.
  > When we save, the entry is validated, persisted safely to local client storage under the demo namespace, and immediately reflected in the rolling trend upon returning to the brief."*
- **Action**: Enter `6`, choose fatigue `3`, enter note `"Restless rest cycle"`, and submit. Verify return to `/crew/ac-cmdr-01` with updated check-in timestamp.

---

### [1:25 – 1:45] Step 5: Recording "Propose Schedule Change"
- **Action**: Scroll to the "Choose your next step" Decision Bar at the bottom of the brief.
- **Presenter**:
  > *"Instead of automating decisions or issuing alarms, ASTROCARE gives the astronaut structured operational options: Recheck, Request review, or Propose schedule change.
  > In light of tomorrow's docking task and the cumulative sleep dip, Alex selects 'Propose schedule change', enters a note: 'Requesting docking approach handover to Flight Engineer Rivera', and saves.
  > The decision saves locally with immediate feedback and logs into the persistent decision history below."*
- **Action**: Select "Propose schedule change", enter note `"Requesting docking approach handover to Flight Engineer Rivera"`, click "Save decision", confirm the confirmation banner, and verify the record in decision history.

---

### [1:45 – 2:00] Step 6: Environmental Context, Footer Badge & Conclusion
- **Action**: Scroll to view the NASA Space Weather card and the persistent footer.
- **Presenter**:
  > *"Finally, we incorporate NASA's DONKI space-weather API to surface external solar activity. This data is strictly environmental background context—it does not imply causation or explain individual health readings.
  > Across every page, our persistent footer confirms: 'Synthetic demonstration data — not medical advice.'
  > It never says ‘unsafe.’ It says ‘worth reviewing’ — and keeps the human in command."*

---

## Fallback Procedures

In the event of network disruption, camera issues, or demo hiccups, execute the following verified fallback procedures:

1. **If QR scanning with a mobile device fails**:
   - *Fallback*: Do not pause. Simply click Commander Alex Chen's badge card directly on the screen, or navigate directly to `/crew/ac-cmdr-01` in the browser URL bar.
2. **If camera permissions or QR image generation fails**:
   - *Fallback*: All badge cards and links are fully functional HTML hyperlinks; the app is 100% operable without camera or QR scanning.
3. **If NASA DONKI live API fetch fails or times out**:
   - *Fallback*: The app automatically catches API failures or rate limits and seamlessly renders the local `spaceweather-fallback.json` cached events, displaying `"Recent solar activity — NASA DONKI (cached)"`. No error modals or broken layouts appear.
4. **If browser local storage is corrupted or full from prior practice runs**:
   - *Fallback*: Click the **"Reset demo"** button in the top navigation header. This instantly clears demo storage and reloads the clean initial demonstration state.
5. **If live check-in form validation triggers**:
   - *Fallback*: Ensure both sleep hours (between 0 and 24) and a fatigue rating (1 through 5) are selected before clicking submit.

---

> “It never says ‘unsafe.’ It says ‘worth reviewing’ — and keeps the human in command.”
