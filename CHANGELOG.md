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
