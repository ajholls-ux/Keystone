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
  green: {
    emoji: "🟢",
    label: "Mature Operational Performance",
    meaning:
      "Generally mature and consistent operational practice. Further Diagnostic investigation may not create meaningful additional value.",
  },
  yellow: {
    emoji: "🟡",
    label: "Moderate Operational Opportunity",
    meaning:
      "Identifiable opportunities or areas of inconsistency that may benefit from attention or selective Diagnostic investigation.",
  },
  red: {
    emoji: "🔴",
    label: "Significant Operational Opportunity",
    meaning:
      "Material weaknesses, evidence gaps or operational risks that may justify deeper investigation.",
  },
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

// ==========================================================================
// Methodology Questions — Methodology Engine v1.0.
//
// Static reference content, not per-Review data. Each question is a
// structured evidence-gathering instrument that feeds the assessor's
// judgement — it does NOT produce its own score. There remains exactly
// one maturityScore and one assessorConfidence per pillar (Health Review
// layer above). No code path here or elsewhere maps a question response
// to a number.
//
// Site Presentation & Customer Journey is the first gold-standard pillar,
// fully authored below. The remaining nine pillars are deliberately left
// as empty arrays — NOT populated with invented methodology — until the
// gold-standard pattern has been tested and explicitly approved for
// replication.
// ==========================================================================
export const PILLAR_QUESTIONS = {
  "site-presentation-customer-journey": [
    {
      id: "q1-first-impression",
      question:
        "If a new customer walked onto the site right now without any prior contact, what would their first impression be?",
      whyItMatters:
        "Tests the actual physical and environmental first impression created by the site — whether presentation is deliberately maintained or simply corrected when somebody notices a problem.",
      assessorPrompt: "Walk me through what a new customer sees and experiences from arrival to being served.",
      followUpPrompts: [
        "Is there a defined presentation standard, or does it depend on who's working?",
        "How would you know if standards had slipped?",
        "When did someone last deliberately walk the site checking presentation rather than simply working in it?",
      ],
      goodExample:
        "We have a daily open-up checklist covering the entrance, yard and signage. The duty supervisor signs it off and anything identified gets logged with an owner and fix date. I can show you this week's.",
      poorExample: "It's generally alright. We sort things out when we notice them.",
      whatToObserve: [
        "Entrance cleanliness",
        "Signage condition",
        "Signage accuracy/currency",
        "Product display/order",
        "Obvious clutter",
        "Customer-facing areas",
        "Whether the site appears deliberately maintained",
        "Whether staff are visible and approachable",
      ],
      evidenceSuggestions: [
        "Direct observation",
        "Presentation/opening checklist",
        "Site standards/documentation",
        "Corroborating staff account",
        "Dated evidence of corrective actions where relevant",
      ],
      maturityGuidance: {
        1: "Reactive — no meaningful presentation standard exists. Problems are generally addressed when noticed.",
        2: "Informal — there is an expectation that the site should look presentable, but ownership/checking is inconsistent.",
        3: "Defined — a clear standard exists and is generally followed, with some checking or ownership.",
        4: "Embedded — presentation standards are clearly defined, routinely checked, owned and maintained consistently rather than depending on individual effort.",
      },
      confidenceGuidance: {
        high: "Direct observation supports what the organisation describes and/or the assessor has corroborating evidence.",
        medium: "The assessor has some supporting evidence but cannot fully observe the standard over time.",
        low: "The judgement relies primarily on verbal description or a single limited observation.",
      },
      diagnosticRelevance:
        "A low maturity score alone does not automatically trigger Diagnostic. Diagnostic consideration becomes stronger where evidence identifies a specific operational gap with meaningful consequences, unclear ownership, or repeated failure. Low confidence should normally lead to better evidence gathering, not automatically to Diagnostic.",
    },
    {
      id: "q2-wayfinding-responsiveness",
      question:
        "Can a customer find what they need without having to ask — and when they do need to ask, how quickly are they typically helped?",
      whyItMatters:
        "Tests whether the physical/customer journey allows customers to navigate effectively and whether staff responsiveness supports the experience.",
      assessorPrompt: "Show me how a customer would locate a common product without staff help.",
      followUpPrompts: [
        "Is there a system for who covers the floor at busy times?",
        "How do you know if customers are waiting too long?",
        "What happens when several customers need help at once?",
      ],
      goodExample:
        "Clear category/signage structure, sensible layout, visible staff and a deliberate approach to floor/customer coverage during busy periods.",
      poorExample: "Customers just ask. Someone always comes eventually.",
      whatToObserve: [
        "Signage clarity",
        "Signage condition",
        "Product/location visibility",
        "Staff positioning",
        "Customer visibility",
        "Responsiveness if observable",
        "Congestion or obvious waiting",
      ],
      evidenceSuggestions: [
        "Direct observation",
        "Customer feedback",
        "Staff interview",
        "Customer-service records",
        "Peak-time staffing/coverage approach",
      ],
      maturityGuidance: {
        1: "No meaningful wayfinding standard and customer response is largely ad hoc.",
        2: "Some signage/awareness exists but the experience depends heavily on who is available.",
        3: "Customers can generally navigate effectively and receive a reasonably prompt response.",
        4: "Wayfinding and responsiveness are deliberately designed, maintained and consistently effective, including during predictable busy periods.",
      },
      confidenceGuidance: {
        high: "Direct observation captures relevant customer activity, ideally during a representative period.",
        medium: "Multiple evidence sources support the judgement.",
        low: "The site is quiet or the assessor cannot observe representative demand and must rely mainly on description.",
      },
      diagnosticRelevance:
        "Consider Diagnostic where poor wayfinding/responsiveness compounds another operational issue or creates a meaningful customer/service risk. Do not treat low confidence as proof of poor performance.",
    },
    {
      id: "q3-complaint-issue-handling",
      question:
        "What happens when a customer has a complaint or a problem with an order — where does it go, who owns it, and how would you know if the same issue kept recurring?",
      whyItMatters:
        "A complaint itself is not necessarily evidence of poor maturity. The maturity signal is whether the organisation can recognise patterns and prevent recurring problems.",
      assessorPrompt: "Talk me through the last complaint you personally dealt with, start to finish.",
      followUpPrompts: [
        "Is that written down anywhere, or does it live in your head?",
        "Has the same type of complaint come up more than once this year?",
        "What happens after the immediate customer issue is resolved?",
      ],
      goodExample:
        "A clear owner, some form of record, and evidence that recurring issues are noticed and acted upon.",
      poorExample: "We deal with it when it comes up. Nothing's really written down.",
      whatToObserve: [
        "Specificity of the answer — a detailed, verifiable example is more valuable than a general statement that complaints are handled well.",
      ],
      evidenceSuggestions: [
        "Complaint records",
        "Issue logs",
        "Customer feedback",
        "Interview",
        "Examples of corrective action",
      ],
      maturityGuidance: {
        1: "No clear owner or mechanism; complaints are dealt with reactively.",
        2: "Informal ownership exists but issues are rarely captured or reviewed.",
        3: "Clear ownership exists and issues are tracked sufficiently to understand what is happening.",
        4: "Complaints/issues are clearly owned, recorded, reviewed for patterns and used to prevent recurrence.",
      },
      confidenceGuidance: {
        high: "A specific example is provided and can be corroborated.",
        medium: "A credible process exists but supporting evidence is limited.",
        low: "Answers remain general and cannot be supported by a specific example or evidence.",
      },
      diagnosticRelevance:
        "A recurring, evidenced complaint pattern with unclear ownership or no effective response is a strong Diagnostic candidate.",
    },
    {
      id: "q4-customer-satisfaction-awareness",
      question: "How does the business know whether customers are satisfied with the experience they receive?",
      whyItMatters:
        "Tests whether customer satisfaction is understood through credible evidence rather than assumption. A lack of formal process is not automatically low maturity — judge the reliability and consistency of the organisation's understanding, not whether it comes through a formal mechanism.",
      assessorPrompt:
        "What's the most recent indication you've had that customers were happy — or unhappy — with the experience they received?",
      followUpPrompts: [
        "How would you know if satisfaction was starting to decline?",
        "Do customers tell you directly?",
        "Do you monitor reviews or complaints?",
        "Do repeat customers give you useful signals?",
        "How does the team share what customers are telling you?",
      ],
      goodExample:
        "Any credible mechanism may be appropriate: structured surveys, reviews, complaint trends, customer conversations, account-manager feedback, repeat customer behaviour, direct owner/manager relationships, customer interviews, informal feedback that is consistently understood, or a combination of several sources.",
      poorExample: "We'd hear about it if something was really wrong.",
      whatToObserve: [
        "Whether the organisation can give credible, specific examples of how it knows customers are satisfied — regardless of whether that knowledge is formal or informal",
      ],
      evidenceSuggestions: [
        "Customer feedback records",
        "Reviews",
        "Complaint trends",
        "Interview",
        "Evidence of repeat business",
        "Direct manager/owner knowledge, where it can be credibly demonstrated",
      ],
      maturityGuidance: {
        1: "Assumed — there is little credible evidence that the organisation knows how customers feel. Satisfaction is largely assumed.",
        2: "Informal — customer sentiment is picked up occasionally through conversations, complaints or other signals, but understanding is inconsistent.",
        3: "Reliable awareness — the organisation has a reasonably reliable way of understanding customer satisfaction, even if informal, and can give credible examples of how it knows when things are going well or changing.",
        4: "Embedded understanding — customer satisfaction is understood consistently through multiple credible signals and is actively used to identify changes, trends or opportunities for improvement.",
      },
      confidenceGuidance: {
        high: "Multiple credible sources support the organisation's understanding, or strong direct evidence exists.",
        medium: "The organisation provides credible examples but evidence is limited.",
        low: "The judgement relies mainly on assumption or general statements with little supporting evidence.",
      },
      diagnosticRelevance:
        "Low maturity does not automatically justify Diagnostic. Consider deeper investigation when there is evidence that the organisation may be missing meaningful customer problems, recurring dissatisfaction, or an important service issue that cannot be understood from the available information.",
    },
    {
      id: "q5-consistency-of-interaction",
      question:
        "Is the standard of customer interaction — greeting, product knowledge and service — something that's trained and consistent, or does it vary significantly by individual?",
      whyItMatters:
        "Tests one of Keystone's central principles: a great individual is not the same thing as an embedded operational standard.",
      assessorPrompt: "How would a new starter learn what 'good service' looks like here?",
      followUpPrompts: [
        "Is there any training on this, or is it picked up by watching others?",
        "Would customers notice a difference depending on who serves them?",
        "How do you know the expected standard is actually being followed?",
      ],
      goodExample:
        "A consistent induction/coaching approach, clear expectations and evidence that the standard is observable across staff.",
      poorExample: "People just pick it up.",
      whatToObserve: [
        "Interactions with different staff",
        "Greeting",
        "Product knowledge",
        "Communication",
        "Consistency",
        "Willingness to help",
        "Differences between individuals",
      ],
      evidenceSuggestions: [
        "Staff interviews",
        "Direct observation",
        "Induction material",
        "Training records",
        "Coaching records",
        "Examples of service expectations",
      ],
      maturityGuidance: {
        1: "Customer experience is entirely dependent on individuals. No meaningful standard is taught.",
        2: "Some individuals perform strongly but expectations are inconsistent or largely learned informally.",
        3: "A basic service standard is communicated and generally followed.",
        4: "Customer-service expectations are actively taught, reinforced and consistently observable across staff.",
      },
      confidenceGuidance: {
        high: "Multiple staff interactions were observed and/or training evidence corroborates the assessment.",
        medium: "Some direct evidence exists but the assessor has not observed enough interactions to establish consistency confidently.",
        low: "Judgement is based mainly on one interaction or management description.",
      },
      diagnosticRelevance:
        "Strong Diagnostic relevance where genuine variation between individuals is evidenced, the issue creates customer/service risk, and/or the organisation is growing, hiring or scaling — inconsistency becomes more significant as the organisation grows.",
    },
  ],

  // Deliberately empty — not yet authored. Do not populate with invented
  // methodology; each will be built and reviewed individually once the
  // gold-standard pattern above is tested and approved.
  "stock-effectiveness-inventory-discipline": [],
  "operational-processes-ways-of-working": [],
  "leadership-accountability": [],
  "commercial-discipline-pricing-governance": [],
  "safety-compliance-risk-culture": [],
  "team-capability-knowledge-transfer": [],
  "operational-resilience-scalability": [],
  "communication-alignment": [],
  "continuous-improvement-performance-management": [],
};

// Current schema version. Bump this and add a migration step in store.js
// if the shape of persisted state ever changes.
export const SCHEMA_VERSION = 6;

// The Assessment Engine version governing reviews created under this
// schema. Recorded per-Review so future methodology versions (v1.1, v1.2...)
// never retroactively alter how a past review is interpreted.
export const CURRENT_ASSESSMENT_ENGINE_VERSION = "1.0";

function generateId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Creates a new, empty PillarAssessment for a given pillar key.
 * Health Review layer only (Assessment Engine v1.0). This is the
 * permanent baseline — it is never overwritten by Diagnostic activity.
 * Diagnostic-layer data lives separately, per cycle (see
 * createDiagnosticCycle / createCyclePillarEntry below), so investigating
 * a pillar in one Diagnostic cycle can never overwrite or block a future
 * cycle's investigation of the same or a different pillar.
 */
export function createPillarAssessment(pillarKey) {
  return {
    id: generateId("pillar"),
    pillarKey,

    healthReviewStatus: "not-started", // not-started | in-progress | complete
    observationNotes: "",
    conversationNotes: "",
    evidence: [],              // { id, sourceType, content, capturedAt }
    strengths: [],              // string[]
    opportunities: [],           // string[] — no solution advice (Engine rule)
    professionalObservation: "",  // client-visible
    internalAssessorNotes: "",     // internal only
    maturityScore: null,            // 1-4, assessor-entered only, holistic per pillar
    assessorConfidence: null,        // { level: High|Medium|Low, reason }, holistic per pillar
    scoreHistory: [],                 // { score, setAt, stage, reason }

    // Methodology Engine v1.0: one response per question (see
    // PILLAR_QUESTIONS above). Keyed by question id. Meaningful assessment
    // data, not disposable UI notes — persists exactly like every other
    // field here. These responses inform the assessor's holistic
    // maturityScore/assessorConfidence above; they never generate a score
    // of their own.
    questionResponses: {}, // { [questionId]: { response, capturedAt } }
  };
}

/**
 * Creates a fresh per-cycle Diagnostic record for a single pillar.
 * Scoped entirely to one Diagnostic cycle — investigating a pillar in
 * Cycle 1 and again in a later cycle produces two independent entries,
 * neither overwriting the other.
 */
export function createCyclePillarEntry() {
  return {
    status: "selected-not-started", // selected-not-started | in-progress | complete
    rootCauseAnalysis: "",
    operationalRisk: "",
    costOfInaction: "",
    recommendations: [],   // { id, text, businessImpact: [] } — businessImpact reserved, unused
    implementationPlan: [], // { id, step, timeframe }
  };
}

/**
 * Creates a new Diagnostic Cycle. A Review may accumulate many cycles
 * over the organisation's improvement journey — each is a self-contained
 * historical record once locked. `pillars` starts empty; pillars are
 * added to it as the assessor selects them for this specific cycle via
 * Diagnostic Pillar Selection.
 */
export function createDiagnosticCycle(cycleNumber) {
  return {
    id: generateId("cycle"),
    cycleNumber,
    startedAt: new Date().toISOString(),
    completedAt: null,
    reportGeneratedAt: null,
    locked: false, // true once this cycle is marked complete — permanent, cycle-scoped only
    pillars: {}, // keyed by pillarKey -> createCyclePillarEntry()
  };
}

/**
 * Creates a new Review, with all ten PillarAssessments pre-created.
 * Governed by Assessment Engine v1.0. A Review represents an
 * organisation's ongoing improvement journey: one Health Review baseline,
 * followed by zero or more Diagnostic Cycles over time. The Review itself
 * is never locked — only individual completed Diagnostic Cycles are.
 */
export function createReview(organisationId) {
  const now = new Date().toISOString();
  return {
    id: generateId("review"),
    organisationId,
    reviewVersion: CURRENT_ASSESSMENT_ENGINE_VERSION,
    dateStarted: now,
    lastUpdatedAt: now,

    healthReviewCompletedAt: null,
    // Client Report must exist before any Diagnostic Cycle can start
    // (Assessment Engine's lifecycle requires this).
    clientReportGeneratedAt: null,

    // Assessor's consultancy recommendation, set at Health Review
    // completion. Never auto-derived (Assessment Engine v1.0 addendum).
    diagnosticRecommendation: null, // not-recommended | recommended | optional
    // Internal-only justification, required only when the assessor's
    // recommendation doesn't align with the calculated Health Indicator.
    recommendationJustification: "",

    pillarAssessments: PILLARS.map((p) => createPillarAssessment(p.key)),

    // The organisation's Diagnostic history. Each entry is an independent,
    // self-contained investigation cycle. A new cycle may only be started
    // once any previous cycle is locked (completed) — this keeps "one
    // active cycle at a time" simple without preventing future cycles.
    diagnosticCycles: [],
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

