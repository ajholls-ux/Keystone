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
 * Calculates the indicator level for a single pillar's score, reusing the
 * same centralised thresholds as the overall Health Indicator. Used for
 * per-pillar messaging in the Client Report (informational only — this
 * never selects a pillar for Diagnostic; that remains a manual assessor
 * decision in Diagnostic Pillar Selection).
 */
export function calculatePillarIndicatorLevel(maturityScore) {
  if (maturityScore == null) return null;
  if (maturityScore >= HEALTH_INDICATOR_THRESHOLDS.green) return "green";
  if (maturityScore >= HEALTH_INDICATOR_THRESHOLDS.yellow) return "yellow";
  return "red";
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
  "assessorConfidence",
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

// Generic guidance overlay for Opportunities, Professional Observation,
// Maturity Score and Assessor Confidence. Pillar-agnostic content,
// applied identically across all ten pillars (unlike PILLAR_QUESTIONS,
// which is pillar-specific and authored one pillar at a time).
const OPPORTUNITIES_GUIDANCE = {
  purpose:
    "Describe the gap or condition you found. Do not prescribe the solution here. Recommendations belong in Diagnostic.",
  goodExample: "Customer complaints are handled individually, with limited evidence of recurring issues being tracked.",
  poorExample: "Introduce a central complaints register reviewed weekly by the branch manager.",
};

const PROFESSIONAL_OBSERVATION_GUIDANCE = {
  purpose:
    "Describe your professional interpretation of the evidence. This is client-visible, but it should not become a free recommendation. Recommendations belong in Diagnostic.",
  goodExample:
    "The branch demonstrates a generally consistent approach to site presentation, although ownership of routine checks appears informal.",
  poorExample: "Introduce a daily presentation checklist owned by the duty supervisor.",
};

// Official score labels are locked (see SCORE_LABELS in scoreSelector.js:
// 1 Significant Opportunity, 2 Developing, 3 Effective, 4 Strong / Mature).
// This guidance explains what each level means in practical terms. It
// does not introduce alternative terminology as a replacement for the
// official labels — every anchor below leads with the locked label.
const MATURITY_SCORE_GUIDANCE = {
  purpose: "One holistic score for the pillar, based on everything gathered. Not an average of the individual questions.",
  scoringGuidance:
    "1 (Significant Opportunity): little consistency or defined practice. Outcomes depend heavily on individuals or immediate reaction.\n" +
    "2 (Developing): some good practice exists but it's inconsistent, informal or dependent on particular people.\n" +
    "3 (Effective): a defined and generally reliable way of working exists and is normally followed.\n" +
    "4 (Strong / Mature): the practice is consistent, understood, maintained and resilient regardless of individual circumstances.\n\n" +
    "These are anchors, not automatic scoring rules. Judge consistency, ownership, repeatability, evidence, and whether the practice survives pressure or someone's absence, then make one professional judgement. " +
    "A low score doesn't automatically mean the business is bad, and a high score doesn't just mean they do this well. It means the practice is embedded rather than accidental. " +
    "Don't reward bureaucracy for its own sake: a small business can operate effectively with informal systems, so distinguish simple but effective from informal and fragile.",
};

const ASSESSOR_CONFIDENCE_GUIDANCE = {
  purpose:
    "Confidence isn't about how confident you feel. It's about how strong the evidence base is for the judgement. It isn't automatically linked to maturity: a pillar can be High maturity with Low confidence, or Low maturity with High confidence, and both are valid, important outcomes.",
  scoringGuidance:
    "High: evidence is strong, relevant and corroborated. Directly observed, documented, corroborated by more than one source, or backed by specific recent examples.\n" +
    "Medium: useful evidence exists but with limitations. One strong source, partial observation, or a credible account with limited corroboration.\n" +
    "Low: judgement relies heavily on assertion, limited observation, or weak or contradictory evidence. A claim that can't be demonstrated, a visit that prevented observation, no recent example, or conflicting accounts.\n\n" +
    "Low confidence doesn't mean low maturity. It means there isn't yet enough evidence to be highly confident in the judgement. Don't automatically downgrade a maturity score because confidence is low; instead, gather more evidence or interpret cautiously.",
};

PILLARS.forEach((p) => {
  Object.assign(PILLAR_GUIDANCE[p.key].opportunities, OPPORTUNITIES_GUIDANCE);
  Object.assign(PILLAR_GUIDANCE[p.key].professionalObservation, PROFESSIONAL_OBSERVATION_GUIDANCE);
  Object.assign(PILLAR_GUIDANCE[p.key].maturityScore, MATURITY_SCORE_GUIDANCE);
  Object.assign(PILLAR_GUIDANCE[p.key].assessorConfidence, ASSESSOR_CONFIDENCE_GUIDANCE);
});

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
        "What would a new customer notice first when they arrive here, and what does the site do to make sure that first impression is maintained?",
      whyItMatters:
        "Tests whether presentation is deliberately maintained or simply fixed when someone happens to notice a problem.",
      assessorPrompt: "Walk me through what a new customer sees from the moment they arrive.",
      followUpPrompts: [
        "Is there a defined presentation standard?",
        "Who is responsible for checking it?",
        "How often is it checked?",
        "How would you know if standards had slipped?",
        "When was the site last deliberately walked specifically to check presentation?",
      ],
      goodExample:
        "We have a daily opening check covering the entrance, yard and signage. The duty supervisor signs it off and anything that needs attention gets logged.",
      poorExample: "It's generally alright. We sort things out when we notice something.",
      whatToObserve: [
        "Entrance condition",
        "Cleanliness",
        "Signage",
        "Product presentation",
        "Visible disorder",
        "Customer-facing areas",
        "Staff visibility and approachability",
      ],
      evidenceSuggestions: [
        "Direct observation",
        "Presentation or checklist documentation",
        "Corroboration from another staff member",
      ],
      maturityGuidance: {
        1: "No clear standard. Presentation is reactive.",
        2: "Informal expectations exist but aren't consistently checked or owned.",
        3: "A defined standard exists and is generally followed, with some checking.",
        4: "Standards are documented or clearly defined, routinely checked and maintained regardless of who is working.",
      },
      confidenceGuidance: {
        high: "Direct observation supports what is being described.",
        medium: "Some supporting evidence exists but the assessor hasn't been able to observe the standard over time.",
        low: "Judgement relies mainly on management assertion without corroboration.",
      },
      diagnosticRelevance:
        "A low score with a specific, evidenced operational gap may justify Diagnostic investigation. A low score combined with weak evidence should lead to more evidence gathering rather than automatically triggering Diagnostic.",
    },
    {
      id: "q2-wayfinding-responsiveness",
      question:
        "Can customers find what they need without help, and when they do need help, how quickly does someone respond?",
      whyItMatters:
        "Reveals whether the customer journey supports easy navigation and whether staff responsiveness backs it up.",
      assessorPrompt: "Show me how a customer would find a common product if they'd never been here before.",
      followUpPrompts: [
        "Is there a system for floor or customer coverage during busy periods?",
        "Who notices if customers are waiting?",
        "How do you know whether customers are getting the help they need?",
      ],
      goodExample:
        "Clear category signage, visible staff and an understood approach to covering customer-facing areas during busy periods.",
      poorExample: "Customers just ask someone. Someone always comes eventually.",
      whatToObserve: [
        "Signage",
        "Visibility",
        "Layout",
        "Staff positioning",
        "Customer movement",
        "Response times where observable",
      ],
      evidenceSuggestions: [
        "Direct observation",
        "Customer feedback",
        "Staff interview",
        "Peak-time staffing approach",
      ],
      maturityGuidance: {
        1: "No meaningful wayfinding standard. Customer response is largely ad hoc.",
        2: "Some signage or awareness exists but the experience depends heavily on who's available.",
        3: "Customers can generally navigate effectively and get a reasonably prompt response.",
        4: "Wayfinding and responsiveness are deliberately designed and consistently effective, including during predictable busy periods.",
      },
      confidenceGuidance: {
        high: "Direct observation during a representative period supports the judgement.",
        medium: "Multiple evidence sources support the judgement, even without full observation.",
        low: "The visit was quiet, or the assessor couldn't observe representative demand and is relying mainly on description. A single visit often won't provide enough evidence about response times, so confidence may reasonably need to stay Low or Medium here.",
      },
      diagnosticRelevance:
        "Particularly relevant when poor wayfinding or responsiveness appears to compound another identified stock, process or customer issue.",
    },
    {
      id: "q3-complaint-issue-handling",
      question:
        "What happens when a customer has a complaint or a problem with an order, and how does the business know if the same problem keeps happening?",
      whyItMatters:
        "A single complaint isn't evidence of poor maturity on its own. The signal is whether the organisation notices patterns and prevents recurrence.",
      assessorPrompt: "Talk me through the last complaint you personally dealt with, from start to finish.",
      followUpPrompts: [
        "Who owns it?",
        "Is it recorded?",
        "What happens after it's resolved?",
        "Has the same type of complaint happened more than once?",
        "How would you know if a pattern was developing?",
      ],
      goodExample:
        "A defined owner, a record or log, and evidence of a recurring issue being identified and addressed.",
      poorExample: "We deal with it when it comes up. Nothing's really written down.",
      whatToObserve: [
        "Specificity of the answer. A detailed, verifiable example is worth more than a general assurance that complaints are handled well.",
      ],
      evidenceSuggestions: [
        "Complaint records",
        "Issue logs",
        "Customer feedback",
        "Interview",
        "Examples of corrective action",
      ],
      maturityGuidance: {
        1: "Reactive, with no ownership or record.",
        2: "Informal ownership but little or no tracking.",
        3: "Clear ownership with some tracking.",
        4: "Clear ownership, recorded, reviewed and patterns acted upon.",
      },
      confidenceGuidance: {
        high: "A specific example is provided and can be corroborated.",
        medium: "A credible process exists but supporting evidence is limited.",
        low: "Answers stay general and can't be backed by a specific example or evidence.",
      },
      diagnosticRelevance:
        "Recurring, evidenced complaints with no ownership or way of spotting patterns are a strong Diagnostic candidate.",
    },
    {
      id: "q4-customer-satisfaction-awareness",
      question: "How does the business know whether customers are happy with the service they receive?",
      whyItMatters:
        "Tests whether customer satisfaction is genuinely understood rather than assumed. A small organisation can operate at high maturity through effective informal relationships. It shouldn't score poorly simply for lacking a survey, QR code or formal feedback system. Assess the effectiveness of the awareness, not its sophistication.",
      assessorPrompt: "What's the last piece of customer feedback you received, and what did you do with it?",
      followUpPrompts: [
        "How would you know if customer satisfaction was slipping?",
        "Do people regularly ask customers how things are going?",
        "How are issues or positive feedback shared with the team?",
        "Can you give me a recent example?",
        "Does the way you collect feedback actually lead to changes?",
      ],
      goodExample:
        "A small branch may have no formal survey at all, but the manager regularly speaks with key customers, staff feed back issues as they hear them, comments are remembered and acted on, and the manager can give recent, concrete examples.",
      poorExample: "We'd hear about it if something was really wrong.",
      whatToObserve: [
        "Whether a credible, specific example can be given, not whether a formal mechanism exists",
      ],
      evidenceSuggestions: [
        "Customer feedback records",
        "Reviews",
        "Complaint trends",
        "Interview",
        "Evidence of repeat business",
        "Direct manager or owner knowledge, where it can be credibly demonstrated",
      ],
      maturityGuidance: {
        1: "Little evidence that customer satisfaction is understood or monitored.",
        2: "Feedback is received informally but is inconsistent or largely reactive.",
        3: "The organisation has a reliable way of knowing how customers are experiencing the service, formal or informal, and can give recent examples.",
        4: "Customer experience is actively monitored, patterns are recognised, and feedback consistently influences decisions or improvements.",
      },
      confidenceGuidance: {
        high: "Multiple credible sources support the organisation's understanding, or strong direct evidence exists.",
        medium: "Credible examples are given but evidence is limited.",
        low: "Judgement relies mainly on assumption or general statements with little supporting evidence.",
      },
      diagnosticRelevance:
        "Low maturity doesn't automatically justify Diagnostic. Consider deeper investigation where the organisation may be missing meaningful customer problems, recurring dissatisfaction, or a service issue that can't be understood from the available information.",
    },
    {
      id: "q5-consistency-of-interaction",
      question:
        "Is good customer service something people are taught and expected to deliver, or does it depend on who happens to be serving?",
      whyItMatters:
        "Tests a central Keystone principle: a great individual isn't the same thing as an embedded operational standard.",
      assessorPrompt: "How would a new starter learn what good customer service looks like here?",
      followUpPrompts: [
        "Is it covered during induction?",
        "Is there any coaching?",
        "Is it mainly learned by watching others?",
        "Would customers notice a difference depending on who served them?",
      ],
      goodExample:
        "A clear service expectation is taught during induction or coaching and can be seen consistently across staff.",
      poorExample: "People just pick it up.",
      whatToObserve: ["Where possible, compare interactions involving different staff members."],
      evidenceSuggestions: [
        "Staff interviews",
        "Direct observation",
        "Induction material",
        "Training or coaching records",
      ],
      maturityGuidance: {
        1: "Entirely individual-dependent, with no shared expectation.",
        2: "Some strong individuals but no consistent standard.",
        3: "A basic standard is communicated and generally followed.",
        4: "Service expectations are actively trained, coached and consistently demonstrated.",
      },
      confidenceGuidance: {
        high: "Multiple staff interactions were observed.",
        medium: "Some direct evidence exists but not enough interactions were observed to establish consistency confidently.",
        low: "Judgement is based mainly on one interaction or a management description.",
      },
      diagnosticRelevance:
        "Particularly relevant where genuine variance between individuals is evidenced and the organisation has growth, hiring or scaling plans.",
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
export const SCHEMA_VERSION = 7;

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
    // PILLAR_QUESTIONS above), plus a lightweight evidenceNotes breadcrumb
    // captured while investigating that specific question. Keyed by
    // question id. Meaningful assessment data, not disposable UI notes —
    // persists exactly like every other field here. Neither generates a
    // score of its own; both inform the assessor's holistic
    // maturityScore/assessorConfidence above.
    //
    // evidenceNotes is deliberately NOT the formal evidence record — it's
    // a quick note taken in the moment, distinct from the pillar-level
    // evidence[] array above (which has source classification and is
    // the assessor's considered, consolidated evidence).
    questionResponses: {}, // { [questionId]: { response, evidenceNotes, capturedAt } }
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

