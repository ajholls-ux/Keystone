# Keystone Field Kit — Changelog

All notable changes to this project are documented here.
Versioning follows semantic versioning (MAJOR.MINOR.PATCH).

---

## v0.1.0 — Application Shell & Foundation

**Release date:** 2026-08-07

### Added
- Application shell (`index.html`, `js/app.js`) with mobile-first single-column layout.
- Design tokens (`css/tokens.css`) implementing the locked Part 4 Design System: colour, typography, spacing.
- Central state store (`js/state/store.js`) with defensive localStorage persistence and export/import backup foundation.
- Data schema (`js/state/schema.js`) defining Organisation, Review, and PillarAssessment containers, plus the fixed ten-pillar enum.
- Stack-based router (`js/router.js`) with `navigate()` / `back()` / `replace()`.
- Landing view with placeholder-but-on-brand copy.
- Organisation List view (stub — proves store/router wiring end to end).
- Reusable Button and Status Marker components.
- Print stylesheet stub, wired but unpopulated.

### Changed
— (first release)

### Fixed
— (first release)

### Known Issues
- Organisation List is a stub: no organisation creation, no persistence of real organisations yet.
- No public preview URL yet — requires one-time GitHub Pages setup (see README).

### Technical Debt
- None introduced. Architecture boundaries (data / state / view / component / navigation) held throughout.

### Next Milestone
Milestone 2 — full Organisation List, New Organisation workflow, real persistence, backup/export UI.

---

## v0.2.0 — Organisation Management

**Release date:** 2026-08-07

### Added
- Full Organisation List view: organisation cards, empty state, status marker per organisation (derived from review data).
- New Organisation form (all fields from Part 5 data model), with required-field validation.
- Organisation Detail stub view (tap-through target from list; full Review Overview arrives in Milestone 3).
- Backup UI: Export Backup and Restore Backup actions on Organisation List, using the store's existing export/import functions.
- Reusable text field component (`js/components/textField.js`) and card component (`js/components/card.js`).

### Changed
- Organisation List now reads and renders real persisted organisations instead of a placeholder count.

### Fixed
— none

### Known Issues
- Organisation Detail is still a stub — Review Overview (pillar progress, starting a review) is not yet built.
- Restore Backup uses a native browser confirm dialog rather than an in-brand confirmation screen; acceptable for MVP, worth revisiting once a modal/dialog component exists.

### Technical Debt
- None introduced. New components follow existing separation-of-concerns pattern.

### Next Milestone
Milestone 3 — Review Overview (ten-pillar progress map) and the ability to start a new Review against an organisation.

---

## v0.3.0 — Assessment Engine Implementation

**Release date:** 2026-08-07

### Added
- Schema updated to Assessment Engine v1.0: two-stage Review (`stage`, `diagnosticUnlocked`, `diagnosticLocked`), dual pillar status tracks (`healthReviewStatus` / `diagnosticStatus`), `reviewVersion` field recording the governing methodology version, `scoreHistory[]` audit trail, `assessorConfidence`, evidence source classification, separate `professionalObservation` / `internalAssessorNotes` fields, Diagnostic-layer fields (root cause, risk, cost of inaction, `recommendations[]`, `implementationPlan[]`, reserved `businessImpact`).
- Organisation Detail: start a new Operational Health Review, view and resume existing reviews.
- Review Overview: full dashboard per locked Part 2 — summary card (organisation, assessment type, stage, progress, average maturity, dates), progress bar, pillar groupings (flat list pre-Diagnostic; Selected/Available/Completed post-unlock), "Start Operational Diagnostic" and "Manage/View Diagnostic Scope" actions.
- Pillar Assessment: summary strip (score, confidence, evidence count, stage); Health Review layer (observation, conversation, evidence with source type, strengths, opportunities, professional observation, internal notes, 1–4 maturity score, assessor confidence); Diagnostic layer rendered conditionally once a pillar is selected; score revision prompts for a reason and appends to history rather than overwriting; "Mark pillar complete" enforces evidence + score presence.
- Diagnostic Pillar Selection: single screen, shows Health Review outcome per pillar, select/deselect, read-only once Diagnostic is locked.
- New reusable components: score selector, text list editor, evidence list editor.

### Changed
- `organisationList.js` status derivation updated for the new Review schema (previously referenced a field removed in this release).
- Schema version bumped to 2; store's migration comment updated to explain why no data migration is required at this stage.

### Fixed
- N/A (no prior release had review-creation functionality to contain bugs in).

### Known Issues
- Assessment Complete, Analysis Transition, and Assessment Report screens (Screen Map items 8–10) are not yet built — completing all pillars currently returns the assessor to Review Overview with no explicit "review complete" moment or report output.
- "Mark pillar complete" evidence check is a presence check (at least one evidence item), not a judgement check on whether evidence sufficiently justifies the score — the Engine's rule is inherently a human judgement call the software can only partially enforce.
- Score/confidence "reason" prompts use native `window.prompt()`, not an in-brand input — acceptable for MVP, worth revisiting once form patterns mature.

### Technical Debt
- None introduced beyond the noted native-dialog usage above.

### Next Milestone
Milestone 4 — Assessment Complete, Analysis Transition, and the Assessment Report engine (Client Report and Diagnostic Report outputs), completing the full assessment-to-report journey.

---

## v0.3.5 — Assessment Experience Layer

**Release date:** 2026-08-07

### Added
- **Client Report gating fixed:** Operational Diagnostic can no longer start until a Client Report has been generated — the Assessment Engine's lifecycle already required this; it was not correctly enforced in Milestone 3. This was treated as Priority One per founder direction.
- **Assessment Complete screen** (Screen 8): handles both Health Review completion (Operational Health Indicator, assessor recommendation, Client Report generation) and Diagnostic completion (final lock confirmation, Diagnostic Report generation).
- **Analysis Transition screen** (Screen 9): brief auto-advancing state sequence between completion and report.
- **Assessment Report screen** (Screen 10): renders both Client Report and Diagnostic Report from the same underlying data, filtered per Assessment Engine §Internal vs. Client Behaviour. Includes cover page, value statement, executive summary, aggregated strengths/opportunities with professional observations, recommendation-outcome messaging, and (Diagnostic only) root cause/risk/cost-of-inaction/recommendations/implementation plan per selected pillar, plus a placeholder Priority Matrix section. PDF export via `window.print()`.
- **Operational Health Indicator** (Assessment Engine v1.0 addendum): a calculated traffic-light summary (🟢/🟡/🔴) of Health Review maturity, shown as decision support only. Thresholds centralised in one config constant — provisional defaults, not yet founder-confirmed as final.
- **Assessor recommendation with validation:** three assessor-chosen outcomes (No Diagnostic Recommended / Recommended / Optional), never auto-derived from score. A justification is required only when the choice doesn't align with the calculated indicator; alignment rules are a provisional, centrally-configured default extrapolated from founder-given examples.
- **Assessment Guidance framework**: ten-section guidance structure (purpose, why it matters, evidence to collect, suggested observations/conversations/photographs, good/poor examples, common mistakes, scoring guidance) per pillar, rendered as a collapsible panel at the top of each Pillar Assessment screen. Structure only — all content starts empty and displays "Not yet added"; methodology content is authored incrementally, not invented here.
- Evidence entries now carry an `entryType` field (currently always `"text"`), reserved so future voice/photo capture can slot in without restructuring the evidence array. No capture UI beyond typed evidence is implemented in this release.

### Changed
- Review Overview: "Start Operational Diagnostic" now only appears after a Client Report exists; added "Complete Health Review," "View Client Report," "Complete Operational Diagnostic," and "View Diagnostic Report" actions at the appropriate lifecycle points.
- Schema version bumped to 3. Review gained `clientReportGeneratedAt`, `diagnosticReportGeneratedAt`, `diagnosticRecommendation`, `recommendationJustification`.

### Fixed
- **Recommendation selection bug caught before release:** the initial implementation lost the assessor's in-progress recommendation selection on every click, because it re-rendered the whole screen from persisted state before that state existed. Fixed to update button styling in place instead.

### Known Issues
- Pillar Assessment guidance panels are empty for all ten pillars — framework only, awaiting authored content.
- Health Indicator thresholds and recommendation-alignment rules are provisional defaults requiring founder sign-off, not final methodology.
- Executive Summary is data-derived (counts, indicator) rather than assessor-authored narrative — there is currently no field for the assessor to write a custom executive summary; flagging as a possible future addition rather than building it now.
- No voice or photo evidence capture — typed evidence only, by design for this milestone.

### Technical Debt
- None introduced beyond what's already noted above as provisional/placeholder by design.

### Next Milestone
To be determined with the founder — remaining candidates include authoring pillar guidance content, confirming Health Indicator thresholds, and psychological/UX polish items (progressive disclosure refinements, cover page design) not yet addressed.

---

## v0.3.6 — UX, Navigation & Report Quality Fixes

**Release date:** 2026-08-08

First real iPhone testing pass against Milestone 3.5 surfaced genuine UX/navigation/report-quality issues. This release fixes those without touching the locked Assessment Engine, Screen Map, or Data Model.

### Fixed
- **Report regeneration-on-Back bug:** pressing Back from a generated report re-rendered the Analysis Transition screen (still in the navigation stack), which immediately auto-forwarded again — making the report feel like it was regenerating on every Back press. Fixed by using `replace()` instead of `navigate()` when moving through Assessment Complete → Analysis Transition → Assessment Report, so the intermediate screens never sit in the back stack. Back from a report now returns directly to Review Overview, and reopening an existing report loads the same generated report — nothing is recreated or duplicated.
- **Strengths/Opportunities input too small on iPhone:** replaced the single-line text input with an auto-growing multi-line textarea (88px minimum height, ~4 lines), full-width Add button below rather than cramped alongside. Add/remove-multiple-entries structure unchanged — only the input affordance changed, not the underlying data model.
- **Guidance placement corrected:** guidance was previously one large block at the top of each pillar. It's now attached directly beneath each individual field it supports (Observation Notes, Conversation Notes, Evidence, Strengths, Opportunities, Professional Observation, Maturity Score) — the assessor encounters it at the point of need, not as a wall of text before starting. `PILLAR_GUIDANCE` restructured from one-block-per-pillar to one-block-per-field-per-pillar; content remains entirely unauthored placeholder, per "framework first, content later."
- **Report no longer looks like a screenshot of the app:** the report screen is now split into a `.report-toolbar` (Back, Export PDF — viewer chrome only) and a `.report-document` (the actual report). Print stylesheet now hides everything except `.report-document` when exporting, so PDF output contains the document only — no navigation, no buttons, no app UI.

### Added
- Report document restructured to a genuine document shape: branded cover page (Keystone Field Kit, report type, organisation, prepared-by/date, value statement) → Executive Summary → Overall Operational Health (indicator) → Strengths (aggregated, pillar-attributed) → Opportunities (aggregated, pillar-attributed) → Pillar Overview (all ten, maturity level per pillar) → Professional Observations → Further Consideration (recommendation-outcome messaging) → [Diagnostic Report only: per-pillar root cause/risk/cost/recommendations/implementation plan, Priority Matrix placeholder] → Closing.

### Changed
- Schema version bumped to 4 (guidance restructure — no persisted-data migration required; guidance is a static export, not stored per-Review).
- `GUIDANCE_SECTIONS` gained a "What to look for" section per the corrected content architecture; "Suggested observations" removed as a distinct section (folded into "What to look for" to avoid overlap with the Observation Notes field it sits under).

### Known Issues
- Still unable to test on a physical iPhone directly — verification here is limited to logic tracing and syntax checking. Please test the specific navigation flow (Review Overview → View Client Report → Back → Review Overview → Reopen) as the highest-priority check, since it's the exact bug this release targets.
- Guidance panels remain empty for all fields, all ten pillars — structure only, as instructed.
- Health Indicator thresholds and recommendation-alignment rules remain provisional, unconfirmed defaults.

### Technical Debt
- None introduced.

### Next Milestone
Recommend: get this release verified against the real iPhone workflow first (per the 30-point testing checklist provided). Only after that passes should work begin on authoring actual pillar guidance content and the deeper Keystone questioning engine — that's real methodology work and deserves to be built on a confirmed-solid mechanical foundation, not layered onto unverified navigation fixes.

---

## v0.3.7 — Diagnostic Cycles Architecture

**Release date:** 2026-08-09

Architectural clarification: an organisation must support an ongoing improvement journey — one Health Review baseline followed by zero or more Diagnostic Cycles over time — rather than being permanently closed off after a single Diagnostic. This release restructures how Diagnostic data is stored to make that possible.

### Changed (breaking schema change — schema version 4 → 5)
- **Diagnostic-layer fields moved off the shared pillar record into per-cycle records.** Previously `rootCauseAnalysis`, `operationalRisk`, `costOfInaction`, `recommendations[]`, and `implementationPlan[]` lived directly on each `PillarAssessment` — meaning a second Diagnostic investigation of any pillar would have overwritten the first, and there was no way to represent more than one cycle. These fields now live in `review.diagnosticCycles[].pillars[pillarKey]`, one independent snapshot per cycle.
- **Review-level `diagnosticLocked` removed entirely.** Locking is now scoped to the individual cycle (`cycle.locked`) — completing a Diagnostic Cycle locks that cycle's findings permanently, but never the Review or the organisation. A new cycle can always be started once the previous one is locked.
- **Pillar-level `diagnosticStatus` removed.** Replaced by `cycle.pillars[pillarKey].status`, meaning pillar selection is scoped to one cycle at a time — a pillar not selected in Cycle 1 remains fully available for Cycle 2, with no permanent "not selected" flag lingering on the pillar itself.
- Review Overview restructured: Health Review pillar list is now always visible (the permanent baseline), followed by the active cycle's pillar groupings (if one is open), followed by a Diagnostic History section listing every locked cycle with its own "View Report" link.
- "Start Operational Diagnostic" is now "Start Operational Diagnostic" for Cycle 1 and "Start Diagnostic Cycle N" for subsequent cycles — appears whenever the Client Report exists and no cycle is currently active. Selecting pillars for a new cycle is entirely manual; nothing is auto-selected by score.
- Diagnostic Pillar Selection, Pillar Assessment (Diagnostic layer), Assessment Complete (Diagnostic path), and Assessment Report (Diagnostic Report) all updated to operate on a specific `cycleId` passed through navigation params, rather than assuming one Review-wide Diagnostic state.

### Fixed
- Two stale references to the removed `review.diagnosticLocked`/`review.stage` fields, found in `organisationDetail.js` and `organisationList.js`, that would have thrown at runtime. Caught this time by a deliberate cross-file reference search after the schema change, not just syntax checking — direct response to the SCORE_LABELS import bug in the previous release.

### Testing performed before this release
Given the previous release shipped with a broken import, verification this time included: syntax checking every file, a static cross-file check that every named import resolves to a real export in its target file, and a targeted search for any remaining references to every field removed or renamed in this schema change. All three passed clean. **This is still not the same as running the app on a physical iPhone** — that remains outstanding and should happen before this is considered done.

### Known Issues
- Not yet tested on a physical device. Priority test path: complete a Health Review → generate Client Report → start Diagnostic Cycle 1 → select one pillar → complete it → complete Cycle 1 → return to Review Overview → confirm Cycle 1 appears under Diagnostic History with a working "View Report" link → start Cycle 2 → confirm a previously unselected pillar is available → confirm Cycle 1's report is unchanged.
- Guidance panels remain empty for all fields, all ten pillars.
- Health Indicator thresholds and recommendation-alignment rules remain provisional, unconfirmed defaults.

### Technical Debt
- None introduced.

### Next Milestone
Physical device verification of the Diagnostic Cycles flow above, then a reconciliation pass against the newly-provided Master Context document (separate from this build — see conversation).

---

## v0.3.8 — Diagnostic Report Lookup Fix

**Release date:** 2026-08-09

Real device testing of v0.3.7 immediately surfaced a genuine bug: completing a Diagnostic Cycle led to "Diagnostic cycle report not found."

### Fixed
- **Analysis Transition was dropping `cycleId`.** When forwarding to the report screen after the transition animation, it only passed `organisationId`, `reviewId`, and `reportType` — a hand-picked subset that silently excluded `cycleId`. This meant the report screen had no way to identify which Diagnostic Cycle to render, even though Assessment Complete had correctly set it and locked the right cycle. Fixed by forwarding the entire `params` object through untouched, so this screen doesn't need to know in advance which fields any given report type requires.

### What this confirms
The underlying data was correct — the cycle had genuinely locked with its findings intact; this was purely a navigation/parameter-passing bug, not data loss. Worth stating plainly since "report not found" could otherwise read as a sign your Diagnostic work vanished — it didn't.

### Testing performed
Traced the full param chain by hand (Assessment Complete → Analysis Transition → Assessment Report) and confirmed `cycleId` now flows through unmodified at every step. This is exactly the class of bug your device test caught that my own checks (syntax + import/export resolution) can't — those verify the code is internally consistent, not that data actually flows correctly between screens across a multi-step navigation sequence. Still needs re-testing on your device to confirm.

### Known Issues
Unchanged from v0.3.7 — guidance panels empty, Health Indicator thresholds provisional.

### Next Milestone
Re-run the Diagnostic Cycle test sequence on device. If it passes, the reconciliation with the Master Context document (pillar-naming discrepancy flagged) is the next open item.

---

## v0.4.0 — Methodology Engine v1.0: First Gold-Standard Pillar

**Release date:** 2026-08-09

The first real methodology content lands: Site Presentation & Customer Journey, fully authored as five structured questions with the complete guidance chain, per the approved response model (Option C).

### Added
- **`PILLAR_QUESTIONS`** static config in `schema.js` — Site Presentation & Customer Journey fully authored (5 questions); the remaining nine pillars deliberately left as empty arrays, not populated with invented content.
- **`questionResponses{}`** added to `PillarAssessment` — one auto-growing response field per question, keyed by stable question ID, storing `{ response, capturedAt }`. Persists exactly like every other assessment field.
- **`createQuestionGuidance` component** — renders the full collapsible guidance chain per question (why it matters, how to ask it, follow-up prompts, good example, poor example, what to observe, evidence suggestions, maturity guidance, confidence guidance, Diagnostic relevance), distinct from the existing generic field-level guidance panel, which remains unchanged underneath.
- **Q1 revised** per review: now tests physical/environmental first impression only; the "consistent regardless of staff/day" concept moved entirely to its follow-up prompts, removing the overlap with Q5.
- **Q4 revised** per review: no longer implies formal feedback mechanisms are required for maturity. Tests reliable *awareness* of customer satisfaction through any credible means — explicitly protects small operators with strong informal customer relationships from being penalised for lacking bureaucracy.
- **Health Indicator meaning text** added (`HEALTH_INDICATOR_LEVELS[level].meaning`) — the approved Green/Yellow/Red interpretive copy, now shown consistently on both Assessment Complete and the Assessment Report's Overall Operational Health section.
- **Recommendation-mismatch justification prompt** updated to the approved wording: "This recommendation appears inconsistent with the current Health Indicator... Please review your evidence and explain why you believe this recommendation remains appropriate."

### Explicitly NOT done (hard rules preserved, verified by direct code search)
- **No automatic scoring.** Confirmed by search: `questionResponses` appears only in `schema.js` (definition) and `pillarAssessment.js` (read/write) — nowhere near `maturityScore` or `assessorConfidence` calculation. One holistic score, one holistic confidence, per pillar, exactly as before.
- **No client-facing leak.** Confirmed by search: `assessmentReport.js` contains zero references to `questionResponses`, `PILLAR_QUESTIONS`, or the question guidance component. Question text, prompts, and examples never reach any report.
- **No automatic Diagnostic selection.** "Diagnostic relevance" guidance is read-only reference text inside each question's collapsible panel — not wired to any selection logic.
- **Diagnostic Cycles, Client Report gating, navigation, report/toolbar separation, evidence source classification, auto-growing Strengths/Opportunities** — all untouched.

### Data model impact
Schema version bumped to 6 (additive field only — `questionResponses` defaults to `{}`).

### UI impact
`pillarAssessment.js` only: the five questions (with response fields and guidance) render as a new section, positioned before the existing Observation/Conversation/Evidence/Strengths/Opportunities fields, which are otherwise unchanged. Renders nothing for the other nine pillars (empty `PILLAR_QUESTIONS` entries) — no regression risk there.

### Testing performed
Syntax check (all files), cross-file import/export resolution (all files), and three targeted searches: confirming no question data reaches the report, confirming no automatic scoring wiring exists, confirming `questionResponses` doesn't appear anywhere unexpected. All clean.

**Not yet done — genuinely outstanding:** physical device testing per the Section 16/17 requirements (low-maturity case, high-maturity case, ambiguous/medium case, low-confidence case, review of the generated report, review of the assessor experience). This release is mechanically verified, not experientially tested. That distinction matters — please don't treat this as "done" until you've actually walked through an assessment on your device.

### Confirmation
The other nine pillars were **not** populated with invented methodology — verified directly in `PILLAR_QUESTIONS`, each holds an explicit empty array with a comment stating why.

### Recommended next step (not started automatically)
Test Site Presentation & Customer Journey on device across the full range of cases in Section 17 of the brief (low/high/ambiguous maturity, low confidence, report review, assessor experience review). Only once that's reviewed and explicitly approved as the gold-standard template should the same *structure* — not the same *content* — be replicated to the remaining nine pillars, authored one at a time.

---

## v0.4.1 — Human-Voiced Methodology & Report Bridge

**Release date:** 2026-08-09

Reconciliation pass against the Master Methodology + Assessment Experience Update. Two genuine conflicts identified and deliberately left unresolved pending confirmation — everything else implemented.

### Changed
- **Site Presentation & Customer Journey questions rewritten** in plainer, more human phrasing — em dashes and formal consultant-speak removed throughout `PILLAR_QUESTIONS`. Same underlying intent, more natural wording an assessor could actually say out loud to a branch manager.
- **Strengths and Opportunities UI replaced.** The multi-entry Add-button list is gone; both fields are now a single large auto-growing textarea, one point per line. Underlying storage is unchanged — still `string[]`, split/joined on newlines. Diagnostic-layer Recommendations and Implementation Plan keep their existing Add-button list pattern (unaffected — they're discrete action items, not free synthesis).
- **Generic field guidance populated** for Opportunities, Professional Observation, Maturity Score, and Assessor Confidence — pillar-agnostic content, applied identically across all ten pillars (distinct from `PILLAR_QUESTIONS`, which stays pillar-specific and authored one at a time). Includes the explicit "don't prescribe the solution" guardrail on Opportunities and Professional Observation.
- **Assessor Confidence field now has a visible guidance panel** — the field existed structurally before but had no attached guidance panel in the UI; fixed as part of populating its content.
- **Recommendation-mismatch justification wording** updated to match the approved phrasing exactly.
- **Client/Diagnostic Report — Pillar Overview** now includes an informational bridge note listing pillars where "further Diagnostic investigation may help establish the underlying causes and operational impact" whenever a pillar's score sits below Green. Purely informational text — no button, no automatic selection; starting a Diagnostic Cycle remains exclusively an assessor action on Review Overview.
- New `calculatePillarIndicatorLevel()` in `schema.js`, reusing the same centralised thresholds as the overall Health Indicator — no new thresholds introduced, nothing scattered.

### Explicitly NOT implemented — genuine conflicts, flagged for confirmation
- **Evidence/confidence in the free Client Report.** The brief lists "evidence/confidence summary" as client-safe content; the locked Assessment Engine v1.0 explicitly says raw evidence and assessor confidence are never client-visible. Neither has been added to the report. Needs explicit clarification on what "summary" means here before implementing.
- **Generic maturity/confidence anchor labels.** The brief's wording ("Reactive/Developing/Established/Embedded") differs from the locked score-selector button labels ("Significant opportunity/Developing/Effective/Strong-Mature"). I've used the new wording only as descriptive guidance text under the score fields — the buttons themselves are unchanged. Needs confirmation on whether the buttons were meant to be renamed too.

### Testing performed
Syntax check (all files), cross-file import/export resolution (all files), and two targeted searches confirming neither flagged conflict was accidentally implemented — both confirmed clean.

**Not yet done:** physical device testing of the new Strengths/Opportunities textarea behaviour (auto-grow, newline splitting on blur, re-population on reopen) and the new report bridge text. Mechanically verified only.

### Recommended next step
Device-test the Strengths/Opportunities change specifically — confirm typing multiple lines, leaving the field, reopening the pillar, and seeing the same lines reappear correctly joined. Then resolve the two flagged conflicts before any further methodology content is authored.

---

## v0.4.2 — Methodology Clarification & First-Pillar Polish

**Release date:** 2026-08-09

Both conflicts flagged in v0.4.1 are now resolved by explicit founder direction — implemented exactly as specified, nothing left open.

### Resolved (were open conflicts in v0.4.1)
- **Evidence/confidence report boundary (Priority 1).** Raw evidence and assessor confidence remain fully internal — confirmed unchanged by direct code search. The Executive Summary now adds one qualitative, client-safe sentence ("The findings below are informed by direct observation, conversation and documentation gathered during the review") — shown only when evidence genuinely exists, so the report never claims more rigour than the assessment actually had. No evidence entries, source classifications, or confidence levels/reasoning are exposed anywhere in either report.
- **Maturity labels.** Confirmed unchanged: `SCORE_LABELS` still reads "Significant opportunity / Developing / Effective / Strong / Mature" — the same locked terminology since the original Assessment Engine v1.0. The alternative framing I'd introduced in v0.4.1 ("Reactive/Developing/Established/Embedded") has been removed from the Maturity Score guidance text entirely and replaced with guidance that leads with the official labels throughout, per explicit instruction not to let alternative framing look like a replacement.

### Changed
- **Full em-dash sweep across all assessor-facing content** (question text, guidance strings, examples) — the generic Maturity Score and Assessor Confidence guidance I wrote in v0.4.1 still had heavy em-dash construction; that's fixed along with four remaining instances in the Site Presentation questions. Verified by a script that walks every non-comment line in `schema.js` — zero em dashes remain outside developer code comments (which are invisible to the assessor and don't affect how anything reads).

### Explicitly NOT changed (confirmed by direct verification, not just asserted)
- Ten pillars, Diagnostic Cycles, Health Review → Client Report → Diagnostic lifecycle, question/response model (Option C), Evidence multi-entry with Add button, Strengths/Opportunities single-textarea UI, Health Indicator thresholds and meaning text, warn-don't-force recommendation alignment, report/toolbar separation, cycle-scoped locking — all unchanged.

### Testing performed
Syntax check (all files), cross-file import/export resolution (all files), a script-based check confirming zero em dashes remain in assessor-facing content, direct grep confirming `SCORE_LABELS` is untouched, and direct grep confirming no raw evidence or confidence data reaches either report (the one `.evidence` reference in the report file only counts array length internally to decide whether to show the qualitative sentence — it never renders evidence content itself).

**Not yet done:** physical device read-through of the new question wording and generic guidance text, to confirm it actually sounds natural when read aloud rather than just mechanically dash-free.

### Files changed
`schema.js`, `assessmentReport.js`, `CHANGELOG.md`.

### Recommended next step
Read through Site Presentation & Customer Journey on device, out loud, as if actually asking a branch manager — confirm it sounds like a person, not a checklist. Then proceed to the Section 22 contrasting-business test (strong/weak/deceptively-strong/small-but-effective) before any decision is made about replicating the pattern to the remaining nine pillars.
