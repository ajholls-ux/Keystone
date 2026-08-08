// ==========================================================================
// Keystone Field Kit — Data Schema
// Source of truth: Product Specification Part 5 (locked, v1.0).
// Governed by Assessment Engine v1.0 (Part 3, locked).
//
// These are containers only. They do NOT encode scoring rules, question
// logic, finding methodology, or recommendation methodology beyond what
// the locked Assessment Engine explicitly defines.
// ==========================================================================

// The fixed ten-pillar enum. Do not rename, merge, or add pillars without
// explicit founder approval (Part 5).
export const PILLARS = [
  { key: "site-presentation-customer-journey", name: "Site Presentation & Customer Journey" },
  { key: "stock-effectiveness-inventory-discipline", name: "Stock Effectiveness & Inventory Discipline" },
  { key: "operational-processes-ways-of-working", name: "Operational Processes & Ways of Working" },
  { key: "leadership-accountability", name: "Leadership & Accountability" },
  { key: "commercial-discipline-pricing-governance", name: "Commercial Discipline & Pricing Governance" },
  { key: "safety-compliance-risk-culture", name: "Safety, Compliance & Risk Culture" },
  { key: "team-capability-knowledge-transfer", name: "Team Capability & Knowledge Transfer" },
  { key: "operational-resilience-scalability", name: "Operational Resilience & Scalability" },
  { key: "communication-alignment", name: "Communication & Alignment" },
  { key: "continuous-improvement-performance-management", name: "Continuous Improvement & Performance Management" },
];

export const EVIDENCE_SOURCE_TYPES = [
  "Observation",
  "Interview",
  "Documentation",
  "KPI / Operational Data",
  "System Evidence",
  "Customer Feedback",
  "Staff Feedback",
  "Other",
];

export const CONFIDENCE_LEVELS = ["High", "Medium", "Low"];

// Assessor-selected outcome for whether an Operational Diagnostic is
// suggested. Never auto-derived from a score threshold alone — this is a
// deliberate methodology decision (Assessment Engine v1.0 addendum): the
// assessor stays in control of the consultancy recommendation. The
// Operational Health Indicator (below) exists purely as decision support.
export const DIAGNOSTIC_RECOMMENDATION_OPTIONS = [
  { key: "not-recommended", label: "No Operational Diagnostic Recommended" },
  { key: "recommended", label: "Operational Diagnostic Recommended" },
  { key: "optional", label: "Operational Diagnostic Optional" },
];

// Operational Health Indicator — Assessment Engine v1.0 addendum.
// A calculated traffic-light summary of Health Review maturity. Decision
// support only; it never replaces or auto-generates the assessor's
// recommendation. Thresholds are centralised here (not scattered through
// the UI) so they remain a single configurable point — the specific
// numbers below are a provisional default, not yet founder-confirmed.
export const HEALTH_INDICATOR_THRESHOLDS = {
  green: 3.0,  // average maturity score >= this → Mature Operational Performance
  yellow: 2.0, // average maturity score >= this (and < green) → Moderate Opportunity
  // below yellow → Significant Operational Opportunity
};

export const HEALTH_INDICATOR_LEVELS = {
  green: { emoji: "🟢", label: "Mature Operational Performance" },
  yellow: { emoji: "🟡", label: "Moderate Operational Opportunity" },
  red: { emoji: "🔴", label: "Significant Operational Opportunity" },
};

// Which assessor recommendations are considered "expected" for a given
// indicator level, before a justification is required. Provisional
// default, extrapolated from the two founder-given examples — not yet
// founder-confirmed as final.
const ALIGNED_RECOMMENDATIONS = {
  green: ["not-recommended", "optional"],
  yellow: ["optional", "recommended", "not-recommended"],
  red: ["recommended", "optional"],
};

/**
 * Calculates the Operational Health Indicator from a set of pillar
 * assessments. Derived at render/decision time — never stored, so it can
 * never drift out of sync with the underlying scores.
 * @returns {{level: 'green'|'yellow'|'red'|null, avgScore: number|null} & object}
 */
export function calculateHealthIndicator(pillarAssessments) {
  const scored = pillarAssessments.filter((p) => p.maturityScore != null);
  if (scored.length === 0) return { level: null, avgScore: null, emoji: "", label: "Not yet scored" };

  const avgScore = scored.reduce((sum, p) => sum + p.maturityScore, 0) / scored.length;
  let level;
  if (avgScore >= HEALTH_INDICATOR_THRESHOLDS.green) level = "green";
  else if (avgScore >= HEALTH_INDICATOR_THRESHOLDS.yellow) level = "yellow";
  else level = "red";

  return { level, avgScore, ...HEALTH_INDICATOR_LEVELS[level] };
}

/**
 * Whether a chosen recommendation is "expected" for the given indicator
 * level — i.e. whether a justification prompt is required.
 */
export function isRecommendationAligned(indicatorLevel, recommendationKey) {
  if (!indicatorLevel) return true; // nothing to validate against yet
  return ALIGNED_RECOMMENDATIONS[indicatorLevel]?.includes(recommendationKey) ?? true;
}

// Assessment Guidance framework. Structure only — content is authored
// field-by-field, pillar-by-pillar over time, not invented here. Every
// section starts empty; the UI shows "Not yet added" for anything
// unpopulated so it's always visible what still needs authoring.
//
// Guidance is attached to the individual field it supports (Strengths,
// Opportunities, Evidence, etc.), not bundled into one block per pillar —
// the assessor should encounter guidance at the point they need it.
export const GUIDANCE_SECTIONS = [
  { key: "purpose", label: "Purpose" },
  { key: "whyItMatters", label: "Why it matters" },
  { key: "whatToLookFor", label: "What to look for" },
  { key: "evidenceToCollect", label: "Evidence to collect" },
  { key: "suggestedConversations", label: "Suggested conversations" },
  { key: "suggestedPhotographs", label: "Suggested photographs" },
  { key: "goodExample", label: "Good example" },
  { key: "poorExample", label: "Poor example" },
  { key: "commonMistakes", label: "Common mistakes" },
  { key: "scoringGuidance", label: "Scoring guidance" },
];

// The fields, within each pillar's Health Review layer, that carry their
// own contextual guidance. Extend this list if a future field should also
// earn guidance — no restructuring required elsewhere to do so.
export const GUIDANCE_FIELDS = [
  "observationNotes",
  "conversationNotes",
  "evidence",
  "strengths",
  "opportunities",
  "professionalObservation",
  "maturityScore",
];

function emptyGuidance() {
  const g = {};
  GUIDANCE_SECTIONS.forEach((s) => (g[s.key] = ""));
  return g;
}

// Keyed by pillarKey, then by field key. Populate incrementally — this
// framework works correctly with every section empty; it does not block
// on full content.
export const PILLAR_GUIDANCE = PILLARS.reduce((acc, p) => {
  acc[p.key] = GUIDANCE_FIELDS.reduce((fieldAcc, fieldKey) => {
    fieldAcc[fieldKey] = emptyGuidance();
    return fieldAcc;
  }, {});
  return acc;
}, {});

// Current schema version. Bump this and add a migration step in store.js
// if the shape of persisted state ever changes.
export const SCHEMA_VERSION = 4;

// The Assessment Engine version governing reviews created under this
// schema. Recorded per-Review so future methodology versions (v1.1, v1.2...)
// never retroactively alter how a past review is interpreted.
export const CURRENT_ASSESSMENT_ENGINE_VERSION = "1.0";

function generateId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Creates a new, empty PillarAssessment for a given pillar key.
 * Structure per Assessment Engine v1.0 §Pillar Data Structure.
 */
export function createPillarAssessment(pillarKey) {
  return {
    id: generateId("pillar"),
    pillarKey,

    // Health Review layer
    healthReviewStatus: "not-started", // not-started | in-progress | complete
    observationNotes: "",
    conversationNotes: "",
    evidence: [],              // { id, sourceType, content, capturedAt }
    strengths: [],              // string[]
    opportunities: [],           // string[] — no solution advice (Engine rule)
    professionalObservation: "",  // client-visible
    internalAssessorNotes: "",     // internal only
    maturityScore: null,            // 1-4, assessor-entered only
    assessorConfidence: null,        // { level: High|Medium|Low, reason }
    scoreHistory: [],                 // { score, setAt, stage, reason }

    // Diagnostic layer — populated only once selected
    diagnosticStatus: "not-selected", // not-selected | selected-not-started | in-progress | complete
    rootCauseAnalysis: "",
    operationalRisk: "",
    costOfInaction: "",
    recommendations: [],   // { id, text, businessImpact: [] } — businessImpact reserved, unused
    implementationPlan: [], // { id, step, timeframe }
  };
}

/**
 * Creates a new Review, with all ten PillarAssessments pre-created.
 * Governed by Assessment Engine v1.0.
 */
export function createReview(organisationId) {
  const now = new Date().toISOString();
  return {
    id: generateId("review"),
    organisationId,
    reviewVersion: CURRENT_ASSESSMENT_ENGINE_VERSION,
    dateStarted: now,
    lastUpdatedAt: now,

    stage: "health-review", // health-review | diagnostic
    diagnosticUnlocked: false,
    diagnosticLocked: false,
    healthReviewCompletedAt: null,
    diagnosticCompletedAt: null,

    // Client Report must exist before Diagnostic can start (Milestone 3.5
    // fix — Assessment Engine's lifecycle already required this; it was
    // not correctly enforced in Milestone 3).
    clientReportGeneratedAt: null,
    diagnosticReportGeneratedAt: null,

    // Assessor's consultancy recommendation, set at Health Review
    // completion. Never auto-derived (Assessment Engine v1.0 addendum).
    diagnosticRecommendation: null, // not-recommended | recommended | optional
    // Internal-only justification, required only when the assessor's
    // recommendation doesn't align with the calculated Health Indicator.
    recommendationJustification: "",

    pillarAssessments: PILLARS.map((p) => createPillarAssessment(p.key)),
  };
}

/**
 * Creates a new Organisation record from New Organisation form input.
 */
export function createOrganisation({
  businessName,
  siteLocation,
  industryType,
  assessorName,
  peopleInvolved,
  scopeOfReview,
  purposeOfReview,
}) {
  return {
    id: generateId("org"),
    businessName: businessName || "",
    siteLocation: siteLocation || "",
    industryType: industryType || "",
    assessorName: assessorName || "",
    peopleInvolved: peopleInvolved || "",
    scopeOfReview: scopeOfReview || "",
    purposeOfReview: purposeOfReview || "",
    createdAt: new Date().toISOString(),
    reviews: [],
  };
}

/**
 * The shape of the entire persisted application state.
 */
export function createEmptyState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    organisations: [],
  };
}

