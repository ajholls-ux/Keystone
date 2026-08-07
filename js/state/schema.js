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

// Current schema version. Bump this and add a migration step in store.js
// if the shape of persisted state ever changes.
export const SCHEMA_VERSION = 2;

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

