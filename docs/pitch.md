# ASTROCARE Pitch & Judge Q&A

ASTROCARE is a lightweight astronaut health self-monitoring web application designed to support operational decision-making during spaceflight missions.

---

## 1. 30-Second Pitch

In deep space, astronauts cannot wait hours for flight surgeons on Earth to tell them how they are doing. ASTROCARE is a rapid self-monitoring tool that compares each crew member’s recent health readings against their own personal baseline—not a generic population average—and explains meaningful changes in plain, neutral language. With rapid 30-second check-ins, badge QR deep links, and upcoming task context, ASTROCARE helps crew members make informed operational choices. It never diagnoses or labels anyone unsafe; it flags what is worth reviewing and keeps the astronaut in command.

---

## 2. 90-Second Pitch

During long-duration spaceflight, circadian disruption, high-tempo workloads, and confined environments steadily degrade sleep, heart rate variability, and cognitive reserve. Traditional ground-dependent monitoring faces growing communication delays, while rigid automated alerts risk alarming crew or triggering false alarms.

ASTROCARE solves this by putting self-monitoring directly into the astronaut's hands through an intuitive personal baseline brief. Instead of comparing biometrics against static population norms, ASTROCARE calculates a 21-day individualized baseline for each crew member and compares it with their rolling 7-day average. When meaningful deviations occur—such as a dip in sleep duration or HRV—the system explains the change in transparent, plain language, side by side with the astronaut's upcoming operational task demands, like manual docking approach monitoring.

Crew members can scan a physical badge QR code or tap their card to open their brief instantly, complete a 30-second check-in, and record immediate operational decisions such as requesting peer review or proposing a schedule adjustment. Environmental telemetry from NASA's DONKI space weather API is displayed strictly as contextual background awareness, ensuring crew understand external mission conditions without false attribution to individual biology.

ASTROCARE never computes arbitrary risk scores, never makes clinical diagnoses, and never declares an astronaut "safe" or "unsafe." By translating personal physiological baselines into actionable operational context, ASTROCARE keeps the human in command.

---

## 3. Project Limitations

To ensure absolute scientific and operational integrity, ASTROCARE explicitly operates within the following boundaries:

1. **Synthetic Demonstration Data**: All crew biometrics, vitals, daily observations (sleep duration, heart rate variability, exercise minutes, radiation readings, mood), and default check-in entries are synthetic fixtures generated for demonstration purposes.
2. **Illustrative Demo Settings**: All mathematical detection thresholds (such as the ±15% deviation flag between the 7-day current window and 21-day baseline window) are illustrative demonstration parameters, not clinically established diagnostic criteria.
3. **No Clinical Validation**: ASTROCARE is an operational concept prototype. It has not undergone clinical trials, FDA review, or NASA operational flight certification, and it does not provide medical diagnoses or treatment recommendations.

---

## 4. Judge Questions & Answers

### Q1: QR Privacy — Does scanning the crew badge expose sensitive health data?
**Answer**:
No. The badge QR code encodes only a deep-link URL pointing to the crew member’s client-side route (e.g., `/crew/ac-cmdr-01`). It contains zero biometric measurements, vital signs, or protected health information (PHI). In this prototype, all personal check-in entries and decision logs remain stored locally in the browser’s `localStorage` on the individual device and are never broadcast over the network. In an operational production deployment, QR access would require hardware-token authentication or zero-trust cryptographic role-based access control (RBAC), ensuring that only authorized personnel can access personal health brief screens.

### Q2: Is this a diagnosis?
**Answer**:
No. ASTROCARE is an operational self-monitoring decision-support tool, not a diagnostic or prognostic system. The software strictly refrains from generating clinical diagnoses, predicting medical outcomes, computing numerical "risk scores," or assigning binary "safe/unsafe" fitness-for-duty designations. Instead, it computes an objective mathematical comparison against an individual's personal reference history and surfaces neutral status descriptions (e.g., "within range", "change worth reviewing", "insufficient data", or "stale data") to encourage timely personal reflection and peer communication.

### Q3: Why are these specific thresholds used?
**Answer**:
The ±15% variance threshold and the 21-day baseline / 7-day current evaluation windows are illustrative demo settings designed to demonstrate how an adaptive, personal baseline algorithm behaves under different operational scenarios (such as normal operations, detectable fatigue, insufficient sample sizes, or stale readings). In actual spaceflight operations, threshold values would be multi-parametric, individualized, and clinically calibrated by flight surgeons and circadian physiologists based on each astronaut's validated pre-flight physiological profile and mission mission phase.

### Q4: Which data is real NASA data?
**Answer**:
The space weather solar flare events queried via the NASA Space Weather Database Of Notifications, Knowledge, Information (DONKI) API (`https://api.nasa.gov/DONKI/FLR`) represent real NASA space weather observation data (with an included static cached fallback for offline or rate-limited environments). Crucially, this solar activity data is presented strictly as environmental contextual awareness. It is never used to correlate with, explain, or infer causation for any crew member's physiological measurements. In contrast, all astronaut biometrics, task schedules, and crew profiles are completely synthetic demonstration fixtures.

### Q5: What would a production version require?
**Answer**:
Transitioning ASTROCARE from a prototype to a flight-certified operational system would require:
- **Clinical Validation**: Comprehensive clinical studies conducted with space medicine researchers and NASA Flight Surgeons to determine validated baseline models, multi-sensor fusion logic, and physiological safety parameters.
- **Flight Hardware & Sensor Integration**: Certified telemetry pipelines connecting real-time astronaut wearable biosensors (such as medical-grade actigraphy, continuous ECG/HRV monitors, and dosimeters) and vehicle life support telemetry.
- **End-to-End Security & Medical Privacy**: Compliance with NASA flight medical privacy policies and HIPAA-equivalent security frameworks, incorporating end-to-end encryption at rest and in transit, multi-factor hardware authentication, and immutable audit logging.
- **Delay-Tolerant Networking (DTN)**: Robust offline-first operational architecture with store-and-forward synchronization over DTN protocols to gracefully accommodate deep-space communications latency and orbital blackout periods.
- **Multi-Variate Contextual Modeling**: Algorithmic enhancement to account for microgravity physiological adaptation curves, high-g transitional phases, circadian lighting protocols, and multi-member workload distribution.
