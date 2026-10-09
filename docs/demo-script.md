# ASTROCARE 2-Minute Live Demo Script

**Target Duration**: 2 minutes (120 seconds)  
**Target Environment**: Deployed web application  
**Primary Persona**: Commander Alex Chen (`ac-cmdr-01`)

---

## Demo Timeline & Spoken Script

### [0:00 – 0:20] Step 1: Crew Badges & Accessing the Brief
- **Action**: Open the deployed website homepage (`/`). The screen displays the crew selection view with digital badge cards for the crew: Commander Alex Chen (`ac-cmdr-01`), Flight Engineer Sam Rivera (`ac-eng-02`), and Mission Scientist Maya Patel (`ac-sci-03`).
- **Presenter**:
  > *"Welcome to ASTROCARE. In spaceflight, autonomy begins with clear self-awareness. On our landing screen, each crew member has a digital badge featuring an instant QR deep link. A crew member can scan their physical badge with a mobile device or click directly on their card to open their personal brief. Let's open Commander Alex Chen (`ac-cmdr-01`)."*
- **Action**: Point phone camera at Commander Alex Chen's badge QR code and open the link, or click directly on Alex Chen's badge card to navigate to `/crew/ac-cmdr-01`.

---

### [0:20 – 0:45] Step 2: Personal Baseline Comparison & Trend Chart
- **Action**: On Commander Chen's brief screen, point out the personal baseline comparison table.
- **Presenter**:
  > *"Here on Commander Chen's Personal Baseline Brief, ASTROCARE doesn't compare Alex against generic population averages. Instead, it compares the last 7 days against Alex's own 21-day personal reference baseline.
  > Notice the status tags: while exercise and radiation remain within normal bounds, Sleep Hours shows a 20% decline (5.8 hours versus a 7.3-hour baseline), and Heart Rate Variability shows a 16% dip (42 milliseconds versus 50 milliseconds). Both are flagged neutrally as 'Worth reviewing'.
  > Expanding the detail shows plain-language explanations alongside an interactive trend chart, with the shaded zone clearly highlighting Alex's personal baseline window."*
- **Action**: Click "Show details" on the Sleep Hours or HRV row to display the explanation text and Recharts trend visualization.

---

### [0:45 – 1:05] Step 3: Upcoming Task Context
- **Action**: Scroll down to the "Upcoming task context" card directly below the baseline comparison.
- **Presenter**:
  > *"Self-monitoring only matters when connected to operational realities. Immediately below the baseline data, the Task Context card shows Alex's upcoming operational milestone: 'Docking approach monitoring' scheduled in 24 hours.
  > ASTROCARE highlights the task's critical demands—sustained attention and fine motor control. Alex now has immediate, objective context connecting recent cumulative fatigue with a high-consequence flight operation."*

---

### [1:05 – 1:25] Step 4: Submitting a Live Check-in
- **Action**: Click the "Add check-in →" button in the upper header to open the check-in screen (`/crew/ac-cmdr-01/checkin`).
- **Presenter**:
  > *"Completing a check-in takes less than 30 seconds. Let's submit a live morning update. We enter 6 hours of sleep, select a fatigue rating of 3 out of 5, add an optional note like 'Restless rest cycle', and hit save.
  > The check-in saves immediately to local device storage, recalculates rolling trends without any server round-trip, and returns us directly to the brief with an updated check-in timestamp."*
- **Action**: Enter `6` in the sleep hours input, select fatigue button `3`, type note `"Restless rest cycle"`, and click "Save check-in and return to brief". Verify navigation back to `/crew/ac-cmdr-01` and updated "Last check-in" timestamp.

---

### [1:25 – 1:45] Step 5: Recording "Propose Schedule Change"
- **Action**: Scroll to the "Choose your next step" Decision Bar at the bottom of the brief.
- **Presenter**:
  > *"Rather than making decisions for the crew, ASTROCARE empowers the human to act. In the Decision Bar, Alex has three proactive options: Recheck, Request review, or Propose schedule change.
  > Given tomorrow's docking maneuver and the sleep deficit, Alex selects 'Propose schedule change', adds a note: 'Requesting docking approach handover to Flight Engineer Rivera', and clicks 'Save decision'.
  > The system confirms 'Decision saved on this device' and logs the entry into Alex's local decision history."*
- **Action**: Click "Propose schedule change", enter note `"Requesting docking approach handover to Flight Engineer Rivera"`, click "Save decision", confirm the green confirmation text, and view the new entry under "Decision history".

---

### [1:45 – 2:00] Step 6: Environmental Context, Footer & Conclusion
- **Action**: Scroll to view the NASA Space Weather context card and the bottom footer.
- **Presenter**:
  > *"Finally, ASTROCARE integrates NASA's DONKI space weather API to provide external solar activity context. This data is strictly environmental background awareness—it does not infer causation or explain personal health readings.
  > Across every screen, our persistent footer reminds the crew: 'Synthetic demonstration data — not medical advice.'
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
   - *Fallback*: Click the **"Reset demo"** button in the top navigation header. This instantly clears `localStorage` and reloads the clean initial demonstration state.
5. **If live check-in form validation triggers**:
   - *Fallback*: Ensure both sleep hours (between 0 and 24) and a fatigue rating (1 through 5) are selected before clicking submit.

---

> “It never says ‘unsafe.’ It says ‘worth reviewing’ — and keeps the human in command.”
