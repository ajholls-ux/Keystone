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
