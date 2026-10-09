# ASTROCARE — Pitch & Judge Q&A (final)

**Tagline:** *It never says "safe." It says "worth reviewing" — and keeps the human in command.*

---

## 30-second pitch

In deep space, astronauts can't wait on Earth to tell them how they're doing. ASTROCARE is a self-monitoring tool that compares each crew member's recent health readings against their **own personal baseline** — not a population average — and explains meaningful changes in plain, neutral language. Thirty-second check-ins, upcoming-task context, honest handling of missing data, and a decision log that keeps the astronaut in command. It never diagnoses and never computes a risk score: it tells you what changed, how trustworthy the data is, and lets you decide.

## 90-second pitch

Long missions erode sleep, heart-rate variability, and cognitive reserve — while communication delays grow and crews shrink. The person best positioned to notice a change in an astronaut is that astronaut, but raw numbers don't self-interpret.

ASTROCARE turns scattered indicators into a **Personal Baseline Brief**: a 21-day individualized reference window compared against the rolling last 7 days, per metric. When something deviates meaningfully — a sleep decline, an HRV dip — the system explains the change transparently, beside the crew member's **upcoming task demands** (a docking approach deserves different attention than a rest day). Daily check-ins covering rest, activity, and wellbeing feed the same pipeline instantly. Data problems are first-class states: insufficient baselines and stale readings are displayed as limits, never papered over with reassuring values.

Three deliberate boundaries define the product: **no diagnosis, no risk scores, no "safe/unsafe" labels.** Every explanation is deterministic and traceable to the arithmetic that produced it — we chose rule-based transparency over an AI layer precisely because this is a health context. NASA's DONKI space-weather feed appears strictly as environmental context, never causally linked to biology.

The same pattern — compare a person to their own baseline, explain honestly, keep decisions human — serves remote communities on Earth, which is why ASTROCARE ships bilingual in English and Myanmar. Built by a five-member student team from Myanmar: fully client-side, offline-capable core, no accounts, deployed and testable today.

---

## Three limitations we state up front
1. **Synthetic data** — real astronaut records are privacy-restricted; all observations are team-generated, labeled in-app, and informed by NASA Human Research Program literature.
2. **Illustrative thresholds** — the 15% review trigger and window sizes are demo settings, not clinically validated values.
3. **Per-device storage** — records live in the browser (by design for the prototype); cross-device sync is future work.

## Claims we never make
Diagnosis · prediction of health outcomes · risk scores · "safe/unsafe" for duty · clinical validation · NASA endorsement · that a planning action improves physiology.

The interface is engineered with a strict semantic design system—utilizing CSS-first tokens across both light and dark themes, calm reduced-motion-compliant animation timing (`--dur-fast`, `--dur-base`), and full English and Myanmar (`en`/`my`) bilingual localization with dedicated Noto Sans Myanmar typography.

---

## Hard judge questions — candid answers

**"Is this medical advice / a diagnostic tool?"**
No. It compares observations against a personal baseline and flags deviations in neutral language. Interpretation and action remain with the human; the persistent footer states it is not medical advice.

**"Why these thresholds?"**
They're illustrative demo settings chosen to make states demonstrable, and the UI labels them as such. Production would calibrate per-metric thresholds from published spaceflight literature with clinical review — that's named future work, not something we fake today.

**"Where's the AI? Your check-in form mentioned 'AstroCare AI'."**
We made the opposite call, deliberately: in a health context, every statement must be traceable, so explanations are deterministic, unit-tested rules — AI tools assisted our *development*, not the product's runtime. We renamed the product plain ASTROCARE to match.

**"What's real NASA data here versus synthetic?"**
Real: the DONKI space-weather feed (live, with cached fallback) and the NASA research that justified which metrics we track. Synthetic: all health observations, clearly labeled. Real astronaut medical data is restricted — honesty about that beats pretending.

**"Anyone who scans a crew badge sees that person's health data?"**
In this demo, yes — synthetic data, and the badge lives behind an explicit action, not on the landing page. A real deployment would gate the deep link behind device identity (badge + crew PIN) or show a non-medical summary. We built the boundary where the prototype needed it and documented the rest.

**"Why no backend?"**
Because nothing requires one: data is seeded or local, computation is client-side, and the one external API is public-tier. That makes the demo resilient — judges can't hit a down server — and it's an architecture choice we can defend, not a gap.

---

## One-line close
*Generic dashboards show readings. ASTROCARE shows what changed — for you, against you — explains it honestly, and leaves the decision where it belongs.*
