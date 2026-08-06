// ==========================================================================
// Keystone Field Kit — Data Schema
// Source of truth: Product Specification Part 5 (locked).
//
// These are containers only. They do NOT encode scoring rules, question
// logic, finding methodology, or recommendation methodology — those belong
// to the Assessment Framework (Part 3, Product Stream, not yet defined).
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

// Current schema version. Bump this and add a migration step in store.js
// if the shape of persisted state ever changes.
export const SCHEMA_VERSION = 1;

function generateId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Creates a new, empty PillarAssessment for a given pillar key.
 * All content fields are empty placeholders — no methodology is invented.
 */
export function createPillarAssessment(pillarKey) {
  return {
    id: generateId("pillar"),
    pillarKey,
    status: "not-started", // 'not-started' | 'in-progress' | 'complete'
    observationNotes: "",
    conversationNotes: "",
    evidence: [],       // shape defined by Assessment Framework (Part 3)
    findings: [],        // shape defined by Assessment Framework (Part 3)
    strengths: [],
    opportunities: [],
    actions: [],          // shape defined by Assessment Framework (Part 3)
    assessorCommentary: "",
    rating: null,          // intentionally unscored until scoring methodology is defined
  };
}

/**
 * Creates a new Review, with all ten PillarAssessments pre-created.
 */
export function createReview(organisationId) {
  return {
    id: generateId("review"),
    organisationId,
    dateStarted: new Date().toISOString(),
    status: "in-progress", // 'in-progress' | 'complete'
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
