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
