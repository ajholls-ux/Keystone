// ==========================================================================
// Keystone Field Kit -- Data Schema
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
// suggested. Never auto-derived from a score threshold alone -- this is a
// deliberate methodology decision (Assessment Engine v1.0 addendum): the
// assessor stays in control of the consultancy recommendation. The
// Operational Health Indicator (below) exists purely as decision support.
export const DIAGNOSTIC_RECOMMENDATION_OPTIONS = [
  { key: "not-recommended", label: "No Operational Diagnostic Recommended" },
  { key: "recommended", label: "Operational Diagnostic Recommended" },
  { key: "optional", label: "Operational Diagnostic Optional" },
];

// Operational Health Indicator -- Assessment Engine v1.0 addendum.
// A calculated traffic-light summary of Health Review maturity. Decision
// support only; it never replaces or auto-generates the assessor's
// recommendation. Thresholds are centralised here (not scattered through
// the UI) so they remain a single configurable point -- the specific
// numbers below are a provisional default, not yet founder-confirmed.
export const HEALTH_INDICATOR_THRESHOLDS = {
  green: 3.0,  // average maturity score >= this Ã¢ÂÂ Mature Operational Performance
  yellow: 2.0, // average maturity score >= this (and < green) Ã¢ÂÂ Moderate Opportunity
  // below yellow Ã¢ÂÂ Significant Operational Opportunity
};

export const HEALTH_INDICATOR_LEVELS = {
  green: {
    emoji: "\uD83D\uDFE2",
    label: "Mature Operational Performance",
    meaning:
      "Generally mature and consistent operational practice. Further Diagnostic investigation may not create meaningful additional value.",
  },
  yellow: {
    emoji: "\uD83D\uDFE1",
    label: "Moderate Operational Opportunity",
    meaning:
      "Identifiable opportunities or areas of inconsistency that may benefit from attention or selective Diagnostic investigation.",
  },
  red: {
    emoji: "\uD83D\uDD34",
    label: "Significant Operational Opportunity",
    meaning:
      "Material weaknesses, evidence gaps or operational risks that may justify deeper investigation.",
  },
};

// Which assessor recommendations are considered "expected" for a given
// indicator level, before a justification is required. Provisional
// default, extrapolated from the two founder-given examples -- not yet
// founder-confirmed as final.
const ALIGNED_RECOMMENDATIONS = {
  green: ["not-recommended", "optional"],
  yellow: ["optional", "recommended", "not-recommended"],
  red: ["recommended", "optional"],
};

/**
 * Calculates the Operational Health Indicator from a set of pillar
 * assessments. Derived at render/decision time -- never stored, so it can
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
 * per-pillar messaging in the Client Report (informational only -- this
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
 * level -- i.e. whether a justification prompt is required.
 */
export function isRecommendationAligned(indicatorLevel, recommendationKey) {
  if (!indicatorLevel) return true; // nothing to validate against yet
  return ALIGNED_RECOMMENDATIONS[indicatorLevel]?.includes(recommendationKey) ?? true;
}

// Assessment Guidance framework. Structure only -- content is authored
// field-by-field, pillar-by-pillar over time, not invented here. Every
// section starts empty; the UI shows "Not yet added" for anything
// unpopulated so it's always visible what still needs authoring.
//
// Guidance is attached to the individual field it supports (Strengths,
// Opportunities, Evidence, etc.), not bundled into one block per pillar --
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
// earn guidance -- no restructuring required elsewhere to do so.
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

// Keyed by pillarKey, then by field key. Populate incrementally -- this
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
// official labels -- every anchor below leads with the locked label.
const MATURITY_SCORE_GUIDANCE = {
  purpose:
    "One holistic score for the pillar, based on everything gathered. Not an average of the individual questions.",
  scoringGuidance:
    "1 -- Significant Opportunity\n" +
    "Little consistency or defined practice. Outcomes depend heavily on individuals or immediate reaction.\n\n" +
    "2 -- Developing\n" +
    "Some good practice exists, but it is inconsistent, informal, or dependent on particular people.\n\n" +
    "3 -- Effective\n" +
    "A defined and generally reliable way of working exists and is normally followed.\n\n" +
    "4 -- Strong / Mature\n" +
    "The practice is consistent, understood, maintained, and resilient regardless of individual circumstances.\n\n" +
    "These are anchors, not automatic rules. Judge consistency, ownership, repeatability, evidence, and whether the practice survives pressure or someone's absence -- then make one professional judgement. A low score does not automatically mean the business is bad. A high score does not just mean they do this well -- it means the practice is embedded rather than accidental. Don't reward bureaucracy: a small business can operate effectively with informal systems. Distinguish simple-but-effective from informal-and-fragile.",
};

const ASSESSOR_CONFIDENCE_GUIDANCE = {
  purpose:
    "Confidence is not about how confident you feel. It is about how strong the evidence base is for the judgement. It is not automatically linked to maturity: a pillar can be High maturity with Low confidence, or Low maturity with High confidence -- both are valid.",
  scoringGuidance:
    "High\n" +
    "Evidence is strong, relevant, and corroborated. Directly observed, documented, backed by more than one source, or supported by specific recent examples.\n\n" +
    "Medium\n" +
    "Useful evidence exists but with limitations. One strong source, partial observation, or a credible account with limited corroboration.\n\n" +
    "Low\n" +
    "Judgement relies heavily on assertion, limited observation, or weak or contradictory evidence. A claim that can't be demonstrated, a visit that prevented observation, no recent example, or conflicting accounts.\n\n" +
    "Low confidence does not mean low maturity. It means there is not yet enough evidence to be highly confident in the judgement. Do not automatically downgrade a maturity score because confidence is low -- gather more evidence or interpret cautiously.",
};

PILLARS.forEach((p) => {
  Object.assign(PILLAR_GUIDANCE[p.key].opportunities, OPPORTUNITIES_GUIDANCE);
  Object.assign(PILLAR_GUIDANCE[p.key].professionalObservation, PROFESSIONAL_OBSERVATION_GUIDANCE);
  Object.assign(PILLAR_GUIDANCE[p.key].maturityScore, MATURITY_SCORE_GUIDANCE);
  Object.assign(PILLAR_GUIDANCE[p.key].assessorConfidence, ASSESSOR_CONFIDENCE_GUIDANCE);
});

// ==========================================================================
// Methodology Questions -- Methodology Engine v1.0.
//
// Static reference content, not per-Review data. Each question is a
// structured evidence-gathering instrument that feeds the assessor's
// judgement -- it does NOT produce its own score. There remains exactly
// one maturityScore and one assessorConfidence per pillar (Health Review
// layer above). No code path here or elsewhere maps a question response
// to a number.
//
// Site Presentation & Customer Journey is the first gold-standard pillar,
// fully authored below. The remaining nine pillars are deliberately left
// as empty arrays -- NOT populated with invented methodology -- until the
// gold-standard pattern has been tested and explicitly approved for
// replication.
// ==========================================================================
export const PILLAR_QUESTIONS = {
  "site-presentation-customer-journey": [
    {
      id: "q1-first-impression",
      investigationRoute: "OBSERVE_THEN_ASK",
      question:
        "What would a new customer notice first when they arrive here, and what does the site do to make sure that first impression is maintained?",
      whyItMatters:
        "Tests whether presentation is deliberately maintained or simply fixed when someone happens to notice a problem. Cover both what is seen and whether it is controlled.",
      assessorPrompt: "Walk the arrival path. Note what a new customer would notice first, then establish how that standard is kept - not only how it looks today.",
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
        "Direct observation of arrival and front of house",
        "Presentation or checklist documentation if used",
        "Corroboration from another staff member",
      ],
      maturityGuidance: {
        1: "No clear standard. Presentation is reactive.",
        2: "Informal expectations exist but aren't consistently checked or owned.",
        3: "A defined standard exists and is generally followed, with some checking.",
        4: "Standards are clear (written or not), routinely checked and maintained regardless of who is working.",
      },
      confidenceGuidance: {
        high: "Direct observation supports what is being described, including how standards are maintained.",
        medium: "Some supporting evidence exists but the assessor hasn't been able to see maintenance over time.",
        low: "Judgement relies mainly on management assertion without corroboration.",
      },
      diagnosticRelevance:
        "A low score with a specific, evidenced operational gap may justify Diagnostic investigation. A low score combined with weak evidence should lead to more evidence gathering rather than automatically triggering Diagnostic.",
    },
    {
      id: "q2-wayfinding-responsiveness",
      investigationRoute: "OBSERVE_THEN_ASK",
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
      investigationRoute: "ASK_THEN_EVIDENCE",
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
      investigationRoute: "ASK_THEN_EVIDENCE",
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
      investigationRoute: "OBSERVE_THEN_ASK",
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

  // Deliberately empty -- not yet authored. Do not populate with invented
  // methodology; each will be built and reviewed individually once the
  // gold-standard pattern above is tested and approved.,
  "stock-effectiveness-inventory-discipline": [
    {
      id: "q1-stock-availability",
      investigationRoute: "OBSERVE_THEN_ASK",
      question: "When a customer asks for a normal line you usually carry, how often is it actually there to sell?",
      whyItMatters: "Tests whether everyday demand can be fulfilled from held stock.",
      assessorPrompt: "Show me how a normal trade request gets fulfilled from stock.",
      followUpPrompts: [
        "What if it is not on the shelf?",
        "How often do you substitute or promise next day?",
        "Which lines are most often missing?"
      ],
      goodExample: "Core trade lines are usually on the shelf. When something is out, the team knows and has a clear next step.",
      poorExample: "We usually have it. If not, we sort something out.",
      whatToObserve: [
        "Empty bays on core lines",
        "Staff hunting for stock",
        "Substitutes as the norm"
      ],
      evidenceSuggestions: [
        "Observation",
        "Interview",
        "Lost-sale notes if used"
      ],
      maturityGuidance: {
        1: "Regular cannot fulfil normal demand.",
        2: "Often available but frequent surprises.",
        3: "Normal demand usually met. Exceptions handled cleanly.",
        4: "Availability is reliable. Problems rare and managed quickly.",
      },
      confidenceGuidance: {
        high: "Saw fulfilment or empty core bays matching the story.",
        medium: "Limited sample.",
        low: "Mainly claims.",
      },
      diagnosticRelevance: "Chronic availability failure may justify Diagnostic.",
    },
    {
      id: "q2-stock-accuracy",
      investigationRoute: "OBSERVE_THEN_ASK",
      question: "When the system says you have stock in a location, how often is that true on the shelf?",
      whyItMatters: "Tests whether the stock picture is usable or fiction.",
      assessorPrompt: "Pick a few lines with me. Does the system match the bay?",
      followUpPrompts: [
        "How do you find out when it is wrong?",
        "How often do you correct it?",
        "Do staff trust the system?"
      ],
      goodExample: "Spot-checks matched. Staff trust the system for selling and picking.",
      poorExample: "The system is roughly right. We fix it when we notice.",
      whatToObserve: [
        "System vs bay",
        "Mislocated stock",
        "Staff ignoring locations"
      ],
      evidenceSuggestions: [
        "System-to-shelf check",
        "Adjustment example",
        "Staff interview"
      ],
      maturityGuidance: {
        1: "System not trusted. Large gaps.",
        2: "Mixed accuracy.",
        3: "Reliable enough day to day.",
        4: "High trust. Errors corrected as normal work.",
      },
      confidenceGuidance: {
        high: "Compared system and shelf on more than one line.",
        medium: "Limited sample.",
        low: "No check.",
      },
      diagnosticRelevance: "Systemic accuracy failure may justify Diagnostic.",
    },
    {
      id: "q3-stock-dead-rotation",
      investigationRoute: "OBSERVE_THEN_ASK",
      question: "How do you deal with slow-moving or dead stock, and what does that look like in the warehouse or yard?",
      whyItMatters: "Tests whether holding stays effective or becomes clogged.",
      assessorPrompt: "Walk me past slower lines. What happens to stock that does not move?",
      followUpPrompts: [
        "Who decides to clear it?",
        "Does it block live lines?",
        "How do you rotate dated product?"
      ],
      goodExample: "Slow stock is owned. Live lines are not buried. Clearance is practical.",
      poorExample: "It builds up. We clear it when we can.",
      whatToObserve: [
        "Dusty or blocked bays",
        "Mixed old and new",
        "Overflow in aisles"
      ],
      evidenceSuggestions: [
        "Observation",
        "Interview",
        "Dead-stock list if any"
      ],
      maturityGuidance: {
        1: "Dead stock dominates. No control.",
        2: "Some clearance. Backlog returns.",
        3: "Holding is workable. Dead stock managed.",
        4: "Tight rotation and clearance discipline.",
      },
      confidenceGuidance: {
        high: "Observation matches the story.",
        medium: "Partial walk.",
        low: "No warehouse view.",
      },
      diagnosticRelevance: "Heavy dead stock may justify Diagnostic.",
    },
    {
      id: "q4-stock-inbound",
      investigationRoute: "OBSERVE_THEN_ASK",
      question: "What happens to a delivery between the truck and the shelf, and does that stock end up findable and right?",
      whyItMatters: "Tests inbound stock becoming available and accurate, not process culture alone.",
      assessorPrompt: "Talk me through the last delivery. Where did it go?",
      followUpPrompts: [
        "How long before put-away?",
        "How do you know the location is right?",
        "What if the truck is late or partial?"
      ],
      goodExample: "Put-away is known. Stock is findable after goods-in. Issues caught early.",
      poorExample: "It gets put away when we can. Sometimes it sits.",
      whatToObserve: [
        "Staging areas",
        "Unlabelled pallets",
        "Stock left in aisles"
      ],
      evidenceSuggestions: [
        "Observation if present",
        "Interview on last delivery"
      ],
      maturityGuidance: {
        1: "Inbound stock often lost, delayed, or wrong.",
        2: "Inconsistent put-away. Availability suffers.",
        3: "Inbound stock usually becomes sellable and findable.",
        4: "Disciplined inbound flow.",
      },
      confidenceGuidance: {
        high: "Saw staging or a detailed recent example.",
        medium: "General description.",
        low: "Vague claims.",
      },
      diagnosticRelevance: "Inbound chaos may justify Diagnostic. Score stock outcome here, not process culture alone.",
    },
    {
      id: "q5-stock-ownership",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "When stock is wrong or missing, who is responsible for fixing it, and how do you know it was fixed?",
      whyItMatters: "Tests ownership and close-out of stock errors.",
      assessorPrompt: "Give a recent stock error. Who fixed it and how did you know?",
      followUpPrompts: [
        "Is ownership clear?",
        "What if it is not fixed?",
        "Same error repeating?"
      ],
      goodExample: "Named ownership. Recent error corrected and checked.",
      poorExample: "We all keep an eye on it.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview with example",
        "System adjustment",
        "Count note"
      ],
      maturityGuidance: {
        1: "No clear owner. Errors linger.",
        2: "Informal ownership. Fixes sometimes.",
        3: "Clear enough ownership. Most errors closed.",
        4: "Strong ownership and follow-through.",
      },
      confidenceGuidance: {
        high: "Concrete example with outcome.",
        medium: "General claim.",
        low: "No example.",
      },
      diagnosticRelevance: "No ownership of stock errors may justify Diagnostic.",
    }
  ],
  "operational-processes-ways-of-working": [
    {
      id: "q1-process-defined",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question:
        "For the main jobs here, is there an agreed way of doing them, or does each person do it their own way?",
      whyItMatters:
        "Tests whether important work has a defined method. The method does not have to be written down. Informal and consistent can be mature; informal and fragile is not.",
      assessorPrompt: "Pick a main job. Is there an agreed way people actually follow, even if it is not written down?",
      followUpPrompts: [
        "Would two people describe the same steps?",
        "Is it written, on screen, or just known?",
        "Does it hold when a key person is away?",
        "When was it last made clear?",
      ],
      goodExample:
        "Main jobs have an agreed way. Staff describe the same steps. It is simple and people follow it - written or not.",
      poorExample: "Everyone knows what they are doing. Common sense.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview",
        "Second person describing the same method where available",
        "Checklist or screen steps if used",
        "Observation of consistent method if seen",
      ],
      maturityGuidance: {
        1: "No agreed method. Pure individual habit.",
        2: "Partial methods. Large variation by person, or method lives only in one head.",
        3: "Agreed ways exist for main jobs and are generally understood and followed.",
        4: "Methods are normal habit, transferable, and hold without depending on one person. Written form is optional if behaviour is embedded.",
      },
      confidenceGuidance: {
        high: "More than one source describes the same method, or clear demonstration.",
        medium: "Single interview with a concrete example.",
        low: "Vague answers with no example.",
      },
      diagnosticRelevance:
        "No defined methods with operational risk may justify Diagnostic on ways of working.",
    },
    {
      id: "q2-process-followed",
      investigationRoute: "OBSERVE_THEN_ASK",
      question: "If you watched different people do the same main job, would you see the same method?",
      whyItMatters: "Tests adherence in practice, not stock or safety outcomes.",
      assessorPrompt: "Can I watch this job, then hear how it should be done?",
      followUpPrompts: [
        "Where do people take shortcuts?",
        "Is that normal or rare?",
        "Does method change by shift?"
      ],
      goodExample: "Observed method matched the description. Variation was small.",
      poorExample: "Depends who is on. They all get there in the end.",
      whatToObserve: [
        "Task sequence",
        "System steps used",
        "Variation between people"
      ],
      evidenceSuggestions: [
        "Observation",
        "Interview after observing"
      ],
      maturityGuidance: {
        1: "Wide variation. Method not followed.",
        2: "Sometimes followed. Depends who works.",
        3: "Generally followed with limited drift.",
        4: "Consistent execution across people.",
      },
      confidenceGuidance: {
        high: "Watched real work vs stated method.",
        medium: "Short observation.",
        low: "No observation.",
      },
      diagnosticRelevance: "Chronic non-adherence may justify Diagnostic.",
    },
    {
      id: "q3-process-exceptions",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "When the usual routine cannot be followed, what are people supposed to do?",
      whyItMatters: "Tests exception handling for the method, not long-run resilience under stress.",
      assessorPrompt: "What happens when the truck is late, system is down, or you are short on a key job?",
      followUpPrompts: [
        "Is the fallback known?",
        "Who decides?",
        "What went wrong last time?"
      ],
      goodExample: "Known fallback for common breaks. Real example given.",
      poorExample: "We just deal with it. You have to be flexible.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview with example"
      ],
      maturityGuidance: {
        1: "Exceptions are pure improvisation.",
        2: "Some fallback, inconsistently applied.",
        3: "Common exceptions have a workable response.",
        4: "Exceptions anticipated and controlled.",
      },
      confidenceGuidance: {
        high: "Clear recent example.",
        medium: "General answer.",
        low: "No coherent answer.",
      },
      diagnosticRelevance: "Exception chaos may justify Diagnostic. Sustained stress capacity is Resilience.",
    },
    {
      id: "q4-process-protected",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "If someone skips the agreed way of working, how do you find out and what happens?",
      whyItMatters: "Tests whether methods are protected, not general leadership quality.",
      assessorPrompt: "Give an example where the method was not followed. What did you do?",
      followUpPrompts: [
        "Noticed only when something breaks?",
        "Same standard for everyone?",
        "Same shortcut returning?"
      ],
      goodExample: "Shortcuts noticed and addressed. Example with outcome.",
      poorExample: "As long as the job gets done we do not make a fuss.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview with example"
      ],
      maturityGuidance: {
        1: "No response when methods ignored.",
        2: "Occasional response.",
        3: "Usually addressed when method skipped.",
        4: "Methods actively protected.",
      },
      confidenceGuidance: {
        high: "Specific example with follow-through.",
        medium: "General claim.",
        low: "No example.",
      },
      diagnosticRelevance: "Methods routinely ignored may justify Diagnostic.",
    },
    {
      id: "q5-process-not-hero",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "If your strongest person on a main job is off tomorrow, does the same way of working still hold?",
      whyItMatters: "Tests whether the method lives in the team, not a full training audit.",
      assessorPrompt: "Name a key job. What changes when the best person is away?",
      followUpPrompts: [
        "Can others run the same steps?",
        "What breaks first?",
        "Is cover planned?"
      ],
      goodExample: "Method still holds with cover. Quality dips little.",
      poorExample: "It gets harder. We manage.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview",
        "Recent absence example"
      ],
      maturityGuidance: {
        1: "Method collapses without one person.",
        2: "Partial hold. Clear individual dependence.",
        3: "Method mostly survives absence.",
        4: "Method robust to normal absence.",
      },
      confidenceGuidance: {
        high: "Recent absence example.",
        medium: "Hypothetical only.",
        low: "No clear picture.",
      },
      diagnosticRelevance: "Hero dependence may justify Diagnostic. Deeper skills sit under Team Capability.",
    }
  ],
  "leadership-accountability": [
    {
      id: "q1-leadership-owner",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question:
        "Who is actually responsible for how this branch should run day to day, and do the team know that?",
      whyItMatters:
        "Tests clear operational ownership. A manager saying they are responsible is weak evidence on its own.",
      assessorPrompt: "Who sets and protects day-to-day standards here? Establish that with more than a job title.",
      followUpPrompts: [
        "Is it one person or split?",
        "Would another relevant person name the same owner where available?",
        "What happens when that standard is not met?",
        "What does head office own vs the branch?",
      ],
      goodExample:
        "Named owner. Another relevant person would give the same answer. A recent example shows what happens when a standard slips.",
      poorExample: "We all take responsibility. It is a team effort.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview with manager",
        "Corroboration from another relevant person where available",
        "Concrete example of ownership in action",
      ],
      maturityGuidance: {
        1: "No clear owner of operational standards.",
        2: "Owner in name only. Team unclear or standards not enforced.",
        3: "Clear enough ownership known to the team, with some follow-through.",
        4: "Ownership is clear, visible and accepted; standards are protected in practice.",
      },
      confidenceGuidance: {
        high: "Manager claim plus corroboration or a strong concrete example.",
        medium: "Clear claim with a partial example.",
        low: "Title-only claim with no corroboration or example.",
      },
      diagnosticRelevance:
        "Unclear ownership with operational drift may justify Diagnostic.",
    },
    {
      id: "q2-leadership-expectations",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question:
        "If you asked staff what good looks like in their job this week, would their answer match yours?",
      whyItMatters:
        "Tests whether expectations exist outside the manager's head. A second-person check helps where available; a concrete shared example can also suffice.",
      assessorPrompt: "What does good look like on the floor this week? How would you know the team shares that?",
      followUpPrompts: [
        "How do you set that?",
        "How often is it reinforced?",
        "What is the priority if time is short?",
        "Would another relevant person describe the same standard where available?",
      ],
      goodExample:
        "Manager and team describe the same practical standard for the current week, or a clear recent example shows shared expectations.",
      poorExample: "They know they need to work hard and look after customers.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview",
        "Light check with another relevant person where available",
        "Visible standards or brief notes if used",
      ],
      maturityGuidance: {
        1: "Expectations vague or conflicting.",
        2: "Some clarity. Not shared consistently.",
        3: "Team can describe current expectations in practical terms.",
        4: "Expectations are clear, current and shared in day-to-day work.",
      },
      confidenceGuidance: {
        high: "Alignment confirmed beyond the manager alone.",
        medium: "Manager gives a specific, testable standard.",
        low: "Generic claims only.",
      },
      diagnosticRelevance:
        "Persistent misalignment of expectations may justify Diagnostic. Shared live priorities across roles also sit under Communication.",
    },
    {
      id: "q3-leadership-followthrough",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "When a standard is not met, what happens? Give a recent example.",
      whyItMatters: "Tests follow-through on standards.",
      assessorPrompt: "Tell me about something that slipped recently. What did you do?",
      followUpPrompts: [
        "Closed or still open?",
        "How long?",
        "Did the team see it mattered?"
      ],
      goodExample: "Specific slip, action taken, outcome known.",
      poorExample: "We talk about it. Things improve eventually.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview with example"
      ],
      maturityGuidance: {
        1: "Slips ignored or only shouted about.",
        2: "Inconsistent follow-through.",
        3: "Slips usually addressed and closed.",
        4: "Follow-through is normal and timely.",
      },
      confidenceGuidance: {
        high: "Concrete example with outcome.",
        medium: "Weak example.",
        low: "No example.",
      },
      diagnosticRelevance: "No follow-through may justify Diagnostic.",
    },
    {
      id: "q4-leadership-accountable",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "When the same issue keeps coming up with the same person or team, how do you handle it?",
      whyItMatters: "Tests consistent accountability without full HR casework.",
      assessorPrompt: "Give an example of a repeated issue. What did you do?",
      followUpPrompts: [
        "Same for everyone?",
        "Escalate if needed?",
        "Does the issue stop?"
      ],
      goodExample: "Repeated issues addressed clearly. Example shows progression.",
      poorExample: "We keep reminding them.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview with example"
      ],
      maturityGuidance: {
        1: "No real accountability for repeats.",
        2: "Reminders only.",
        3: "Repeated issues usually gripped.",
        4: "Consistent fair accountability that changes behaviour.",
      },
      confidenceGuidance: {
        high: "Clear example.",
        medium: "General claim.",
        low: "No example.",
      },
      diagnosticRelevance: "Repeated issues never gripped may justify Diagnostic.",
    },
    {
      id: "q5-leadership-visible",
      investigationRoute: "OBSERVE_THEN_ASK",
      question: "How often is leadership out on the floor setting the standard, not only fixing crises?",
      whyItMatters: "Tests visible operational leadership.",
      assessorPrompt: "When are you on the floor on a normal day, and what for?",
      followUpPrompts: [
        "Planned or only when broken?",
        "Would staff say you are visible?",
        "What standard do you reinforce?"
      ],
      goodExample: "Leadership regularly visible for standards, not only emergencies.",
      poorExample: "I am around if they need me.",
      whatToObserve: [
        "Leader presence",
        "Crisis-only vs calm presence"
      ],
      evidenceSuggestions: [
        "Observation",
        "Staff interview",
        "Manager interview"
      ],
      maturityGuidance: {
        1: "Absent except in crisis.",
        2: "Occasional. Mostly reactive.",
        3: "Regular enough presence.",
        4: "Visible deliberate floor leadership is normal.",
      },
      confidenceGuidance: {
        high: "Observation matches description.",
        medium: "Interview only.",
        low: "No observation and weak description.",
      },
      diagnosticRelevance: "Invisible leadership may justify Diagnostic.",
    }
  ],
  "commercial-discipline-pricing-governance": [
    {
      id: "q1-commercial-price-control",
      investigationRoute: "OBSERVE_THEN_ASK",
      question: "How are selling prices controlled here, and what happens when someone wants to discount?",
      whyItMatters: "Tests whether price is governed or informal.",
      assessorPrompt: "Show me how a price is set or changed on a normal line.",
      followUpPrompts: [
        "Who can authorise a discount?",
        "How recorded?",
        "What stops random cuts?"
      ],
      goodExample: "Prices follow a clear rule. Discounts need known authority.",
      poorExample: "We know our prices. We look after the customer if we need to.",
      whatToObserve: [
        "Shelf vs system price",
        "Ad hoc discounting"
      ],
      evidenceSuggestions: [
        "Observation",
        "Interview",
        "Discount note if used"
      ],
      maturityGuidance: {
        1: "Prices informal. Discounting uncontrolled.",
        2: "Some rules. Often bent.",
        3: "Prices and discounts generally controlled.",
        4: "Tight commercial control, evidenced.",
      },
      confidenceGuidance: {
        high: "Observation and rules align.",
        medium: "Interview limited check.",
        low: "Claims only.",
      },
      diagnosticRelevance: "Uncontrolled discounting may justify Diagnostic.",
    },
    {
      id: "q2-commercial-margin-awareness",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question:
        "How do people here know whether a sale is commercially sensible, not only whether the customer is happy?",
      whyItMatters:
        "Tests margin awareness in day-to-day selling. Knowing margins in theory is not enough without a real decision example.",
      assessorPrompt: "When you discount or negotiate, how do you know you are not giving the job away? Give a recent example.",
      followUpPrompts: [
        "Do staff see margin or only price?",
        "What is protected?",
        "What is a recent example of a shaped, refused or adjusted deal?",
      ],
      goodExample:
        "Team understands commercial limits. Recent example of a refused or shaped deal with a clear commercial reason.",
      poorExample: "We know our margins. We try to win the work. Volume matters.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview with a specific decision example",
        "Any margin guidance used in practice",
      ],
      maturityGuidance: {
        1: "No commercial filter on deals.",
        2: "Weak awareness. Hero managers only.",
        3: "Generally aware. Major deals controlled.",
        4: "Strong commercial awareness in normal selling, shown in real decisions.",
      },
      confidenceGuidance: {
        high: "Clear recent example of commercial judgement in a deal.",
        medium: "Plausible practice with a weaker example.",
        low: "General talk with no example.",
      },
      diagnosticRelevance:
        "Repeated value-destroying deals may justify Diagnostic.",
    },
    {
      id: "q3-commercial-exceptions",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "When a special price is agreed, how is it controlled through the branch?",
      whyItMatters: "Tests commercial exception control.",
      assessorPrompt: "Walk me through the last special price. Who agreed it and how did the branch know?",
      followUpPrompts: [
        "Invoice correct?",
        "Can anyone invent a deal?",
        "How often?"
      ],
      goodExample: "Specials follow a path. Paperwork matches the agreement.",
      poorExample: "We note it and hope it comes out right.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview",
        "Example note"
      ],
      maturityGuidance: {
        1: "Specials chaotic.",
        2: "Partial control.",
        3: "Specials usually controlled end to end.",
        4: "Disciplined commercial exceptions.",
      },
      confidenceGuidance: {
        high: "Full example traced.",
        medium: "Partial example.",
        low: "No example.",
      },
      diagnosticRelevance: "Broken commercial exceptions may justify Diagnostic.",
    },
    {
      id: "q4-commercial-leakage",
      investigationRoute: "OBSERVE_THEN_ASK",
      question: "Where does commercial value leak day to day, and is that watched?",
      whyItMatters: "Tests everyday leakage beyond formal discounts.",
      assessorPrompt: "What gets given away or not charged that should be watched?",
      followUpPrompts: [
        "Visible to management?",
        "Challenged?",
        "Recent example?"
      ],
      goodExample: "Leakage known and challenged within reason for trade.",
      poorExample: "You have to look after the customer.",
      whatToObserve: [
        "Uncharged extras",
        "Informal free issues"
      ],
      evidenceSuggestions: [
        "Observation",
        "Interview"
      ],
      maturityGuidance: {
        1: "Leakage open and unmanaged.",
        2: "Some awareness. Little grip.",
        3: "Mostly controlled.",
        4: "Tight everyday commercial discipline.",
      },
      confidenceGuidance: {
        high: "Observation supports story.",
        medium: "Interview only.",
        low: "No view.",
      },
      diagnosticRelevance: "Material leakage may justify Diagnostic.",
    },
    {
      id: "q5-commercial-ownership",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question:
        "How do you know commercial discipline is holding across the branch, and what do you do when it is not?",
      whyItMatters:
        "Tests monitoring and intervention over time, not who can change a price (that is price control). One useful signal and one intervention example is enough for a Health Review.",
      assessorPrompt: "What tells you commercial discipline is slipping, and what did you last do about it?",
      followUpPrompts: [
        "What signal do you actually use?",
        "How often do you look at it?",
        "Give a recent example of intervening when discipline slipped.",
      ],
      goodExample:
        "We watch discount levels on a simple weekly view. Last month one counter was over-discounting; the manager reset the rule and checked the following week.",
      poorExample: "I own commercial discipline. I keep an eye on things.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview with monitoring signal and intervention example",
        "Any simple report or note used in practice",
      ],
      maturityGuidance: {
        1: "No monitoring of commercial discipline. Slippage goes unnoticed.",
        2: "Informal awareness only. Rare or weak intervention.",
        3: "Some signal is used and issues are usually addressed.",
        4: "Commercial discipline is actively watched and corrected when it slips.",
      },
      confidenceGuidance: {
        high: "Clear signal plus a concrete intervention example.",
        medium: "Signal described with a weaker example.",
        low: "Ownership claim with no signal or intervention.",
      },
      diagnosticRelevance:
        "No grip on commercial slippage with weak results may justify Diagnostic.",
    }
  ],
  "safety-compliance-risk-culture": [
    {
      id: "q1-safety-practice",
      investigationRoute: "OBSERVE_THEN_ASK",
      question: "What does safe working look like on this site in practice, not on the poster?",
      whyItMatters: "Tests lived safety practice.",
      assessorPrompt: "Walk the floor with safety in mind. What should I see?",
      followUpPrompts: [
        "PPE?",
        "Housekeeping hazards?",
        "Vehicle and pedestrian behaviour?"
      ],
      goodExample: "Observed practice matches expectations. Issues not ignored.",
      poorExample: "We are pretty good on safety.",
      whatToObserve: [
        "PPE",
        "Housekeeping",
        "Vehicle mix",
        "Shortcuts"
      ],
      evidenceSuggestions: [
        "Observation",
        "Interview"
      ],
      maturityGuidance: {
        1: "Unsafe practice common or tolerated.",
        2: "Mixed practice.",
        3: "Generally safe on the day.",
        4: "Strong habitual safe practice.",
      },
      confidenceGuidance: {
        high: "Direct observation.",
        medium: "Limited observation.",
        low: "Statements only.",
      },
      diagnosticRelevance: "Unsafe practice may justify Diagnostic; serious risk needs specialist action.",
    },
    {
      id: "q2-safety-near-miss",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "What happens after a near miss or safety concern is raised?",
      whyItMatters: "Tests risk management after events.",
      assessorPrompt: "Tell me about a recent near miss or concern and what changed.",
      followUpPrompts: [
        "Reported?",
        "Who acts?",
        "Same issue return?"
      ],
      goodExample: "Recent example reported and acted on.",
      poorExample: "We would deal with it if something happened.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview",
        "Report if exists"
      ],
      maturityGuidance: {
        1: "Near misses ignored.",
        2: "Reporting rare.",
        3: "Concerns usually handled.",
        4: "Near-miss learning is normal.",
      },
      confidenceGuidance: {
        high: "Concrete example with action.",
        medium: "Weak example.",
        low: "None.",
      },
      diagnosticRelevance: "No near-miss practice may justify Diagnostic.",
    },
    {
      id: "q3-safety-compliance-basics",
      investigationRoute: "OBSERVE_THEN_ASK",
      question:
        "Are basic compliance expectations present and followed for this environment?",
      whyItMatters:
        "Tests practical basics for this site, not a legal compliance programme. Absence of paperwork alone must not lower maturity where practical control is working. Serious or immediate issues are escalated, not treated only as a maturity score.",
      assessorPrompt: "What must be in place here for this kind of operation, and is it actually followed on the day?",
      followUpPrompts: [
        "What is out of date or missing in practice?",
        "Who checks the basics that matter here?",
        "What happens when something expires or fails?",
      ],
      goodExample:
        "Basic required controls for this environment are present and followed enough for confidence on the day. Practice matches what people say.",
      poorExample: "Head office handles that. We are covered. It is all in the folder.",
      whatToObserve: [
        "Obvious site controls relevant to this environment",
        "Practice vs poster",
        "Clear gaps that affect risk on the day",
      ],
      evidenceSuggestions: [
        "Observation of practical controls",
        "Sample of records only where they support real practice",
        "Interview",
      ],
      maturityGuidance: {
        1: "Basics missing or clearly neglected in practice.",
        2: "Partial or outdated controls; weak day-to-day follow-through.",
        3: "Basics largely in place and followed for this environment.",
        4: "Practical compliance habits are sound and checked. Paperwork is not required for a 4 if behaviour is embedded.",
      },
      confidenceGuidance: {
        high: "Saw practice and/or clear current controls on the day.",
        medium: "Partial view of practice or records.",
        low: "Claims only, or folder evidence with no link to practice.",
      },
      diagnosticRelevance:
        "Compliance gaps may justify Diagnostic. Serious legal or immediate safety risk needs proper escalation outside a maturity debate.",
    },
    {
      id: "q4-safety-challenge",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "Can staff challenge unsafe work, and what happens if they do?",
      whyItMatters: "Tests safety culture in behaviour.",
      assessorPrompt: "If someone refused an unsafe task, what would happen?",
      followUpPrompts: [
        "Real example?",
        "Pressure to deliver?",
        "Leadership response?"
      ],
      goodExample: "Challenge accepted. Credible support.",
      poorExample: "They can say something. We need to get the work out.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Staff interview if possible",
        "Manager interview"
      ],
      maturityGuidance: {
        1: "Challenge unsafe or pointless.",
        2: "Mixed signals.",
        3: "Challenge generally possible.",
        4: "Challenge expected and supported.",
      },
      confidenceGuidance: {
        high: "Staff and manager align.",
        medium: "Manager only.",
        low: "No credible answer.",
      },
      diagnosticRelevance: "Suppressed challenge may justify Diagnostic.",
    },
    {
      id: "q5-safety-ownership",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "Who owns safety day to day on this site, and how do they know standards are holding?",
      whyItMatters: "Tests local safety ownership.",
      assessorPrompt: "Who is responsible for safety today, and what do they check?",
      followUpPrompts: [
        "Title only?",
        "Last action?",
        "Team clear?"
      ],
      goodExample: "Named owner. Practical checks. Recent action.",
      poorExample: "Everyone owns safety.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview",
        "Check record if any"
      ],
      maturityGuidance: {
        1: "No real owner.",
        2: "Owner in name only.",
        3: "Clear local ownership with some grip.",
        4: "Active ownership with evidence.",
      },
      confidenceGuidance: {
        high: "Owner plus example.",
        medium: "Name only.",
        low: "Unclear.",
      },
      diagnosticRelevance: "No ownership with weak practice may justify Diagnostic.",
    }
  ],
  "team-capability-knowledge-transfer": [
    {
      id: "q1-capability-skills",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "Do people have the skills for the jobs they are doing, including busy or cover days?",
      whyItMatters: "Tests capability for the work demanded.",
      assessorPrompt: "Where are you thin on skill, and how do you cope?",
      followUpPrompts: [
        "What training is real?",
        "Where do errors show gaps?"
      ],
      goodExample: "Skills match the work. Gaps known and managed.",
      poorExample: "They learn on the job. We get by.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview",
        "Training sample",
        "Error examples"
      ],
      maturityGuidance: {
        1: "Skill gaps harming the operation.",
        2: "Uneven skills. Depends on a few people.",
        3: "Generally capable for normal demand.",
        4: "Strong capability across the team.",
      },
      confidenceGuidance: {
        high: "Examples of skill and gap management.",
        medium: "General claim.",
        low: "No detail.",
      },
      diagnosticRelevance: "Skill gaps may justify Diagnostic.",
    },
    {
      id: "q2-capability-cover",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "When key people are off, can the branch still run important jobs to an acceptable standard?",
      whyItMatters: "Tests cover beyond a single process method.",
      assessorPrompt: "Who covers key roles, and what drops when they are away?",
      followUpPrompts: [
        "Cover planned?",
        "Cross-skilled?",
        "Recent absence?"
      ],
      goodExample: "Cover exists. Recent absence handled without collapse.",
      poorExample: "We struggle if the wrong person is off.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview",
        "Absence example"
      ],
      maturityGuidance: {
        1: "No effective cover.",
        2: "Fragile cover.",
        3: "Adequate cover for normal absence.",
        4: "Robust cover and cross-skilling.",
      },
      confidenceGuidance: {
        high: "Recent example.",
        medium: "Hypothetical only.",
        low: "Unclear.",
      },
      diagnosticRelevance: "Fragile cover may justify Diagnostic.",
    },
    {
      id: "q3-capability-knowledge",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "How much critical know-how lives in one person's head?",
      whyItMatters: "Tests knowledge concentration risk.",
      assessorPrompt: "What does only one person really know how to do here?",
      followUpPrompts: [
        "If they leave?",
        "Shared or written?",
        "Being passed on?"
      ],
      goodExample: "Critical knowledge shared or recorded enough to protect the branch.",
      poorExample: "A few people just know.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview"
      ],
      maturityGuidance: {
        1: "Critical knowledge is single-point.",
        2: "Some sharing. Still concentrated.",
        3: "Key knowledge adequately spread.",
        4: "Knowledge actively shared and protected.",
      },
      confidenceGuidance: {
        high: "Specific single points with sharing evidence.",
        medium: "Vague.",
        low: "No insight.",
      },
      diagnosticRelevance: "Single-point knowledge risk may justify Diagnostic.",
    },
    {
      id: "q4-capability-training",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "How do new or moving people get to a safe, useful standard on this site?",
      whyItMatters: "Tests practical training into the work.",
      assessorPrompt: "What happens in the first weeks for a new starter?",
      followUpPrompts: [
        "Who trains?",
        "How do you know they are ready?",
        "What is skipped when busy?"
      ],
      goodExample: "Structured enough onboarding. Readiness checked somehow.",
      poorExample: "They shadow someone and pick it up.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview",
        "Induction checklist if any"
      ],
      maturityGuidance: {
        1: "No real training pattern.",
        2: "Informal only.",
        3: "Practical training for main roles.",
        4: "Training deliberate and checked.",
      },
      confidenceGuidance: {
        high: "Clear description plus artefact if any.",
        medium: "Thin description.",
        low: "None.",
      },
      diagnosticRelevance: "Weak training may justify Diagnostic.",
    },
    {
      id: "q5-capability-performance",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "How do you know someone is performing in the role, and what do you do when they are not?",
      whyItMatters: "Tests performance grip, not full HR design.",
      assessorPrompt: "How do you spot underperformance early, and what do you do?",
      followUpPrompts: [
        "Feedback normal?",
        "Recent example?",
        "Behaviour change?"
      ],
      goodExample: "Performance discussed practically. Example of action.",
      poorExample: "We know who the good ones are.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview with example"
      ],
      maturityGuidance: {
        1: "No performance grip.",
        2: "Informal views. Little action.",
        3: "Performance issues usually addressed.",
        4: "Active fair performance management in practice.",
      },
      confidenceGuidance: {
        high: "Example with outcome.",
        medium: "General claim.",
        low: "None.",
      },
      diagnosticRelevance: "Unmanaged underperformance may justify Diagnostic.",
    }
  ],
  "operational-resilience-scalability": [
    {
      id: "q1-resilience-peaks",
      investigationRoute: "OBSERVE_THEN_ASK",
      question: "What happens to this branch when it is really busy?",
      whyItMatters: "Tests capacity under peak load.",
      assessorPrompt: "Describe the last peak. What held and what broke?",
      followUpPrompts: [
        "Customer wait?",
        "Errors?",
        "Safety shortcuts?",
        "Leadership response?"
      ],
      goodExample: "Peaks strained but controlled. Priorities hold.",
      poorExample: "It gets hectic. We get through it.",
      whatToObserve: [
        "Queues",
        "Stress behaviour",
        "Shortcuts under load"
      ],
      evidenceSuggestions: [
        "Observation if busy",
        "Interview on last peak"
      ],
      maturityGuidance: {
        1: "Peaks cause uncontrolled failure.",
        2: "Peaks painful with repeated breaks.",
        3: "Peaks managed well enough.",
        4: "Peak performance planned and controlled.",
      },
      confidenceGuidance: {
        high: "Detailed example or live observation.",
        medium: "Thin story.",
        low: "No account.",
      },
      diagnosticRelevance: "Peak failure may justify Diagnostic.",
    },
    {
      id: "q2-resilience-absence",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "How does the branch cope with unexpected or hard absence?",
      whyItMatters: "Tests structural coping with absence.",
      assessorPrompt: "Tell me about a hard absence week. What did you protect?",
      followUpPrompts: [
        "Who re-planned?",
        "What failed first?",
        "Time to recover?"
      ],
      goodExample: "Absence absorbed with clear choices about what to protect.",
      poorExample: "We all just do more.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview with example"
      ],
      maturityGuidance: {
        1: "Absence tips branch into failure.",
        2: "Fragile under absence.",
        3: "Copes with normal hard weeks.",
        4: "Plans and absorbs absence well.",
      },
      confidenceGuidance: {
        high: "Concrete example.",
        medium: "General claim.",
        low: "None.",
      },
      diagnosticRelevance: "Fragile absence response may justify Diagnostic.",
    },
    {
      id: "q3-resilience-disruption",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "When something external disrupts you, how does the branch respond?",
      whyItMatters: "Tests disruption response.",
      assessorPrompt: "Give a recent disruption. What did you do in the first hour and first day?",
      followUpPrompts: [
        "Who takes charge?",
        "Customer communication?",
        "Workaround quality?"
      ],
      goodExample: "Response organised. Example shows control under pressure.",
      poorExample: "We muddle through.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview",
        "Incident note if any"
      ],
      maturityGuidance: {
        1: "Disruptions become prolonged chaos.",
        2: "Inconsistent response.",
        3: "Usually regains control in reasonable time.",
        4: "Practised disruption handling.",
      },
      confidenceGuidance: {
        high: "Strong example.",
        medium: "Weak example.",
        low: "None.",
      },
      diagnosticRelevance: "Poor disruption response may justify Diagnostic.",
    },
    {
      id: "q4-resilience-bottlenecks",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question:
        "What is the real bottleneck that limits this branch, and is it understood?",
      whyItMatters:
        "Tests whether constraints are known from evidence, not only opinion. Naming a bottleneck without proof is weak.",
      assessorPrompt: "What limits you most on a hard day? What evidence makes you believe that, what effect does it have, and what have you tried?",
      followUpPrompts: [
        "What evidence supports that this is the bottleneck?",
        "What operational effect does it create?",
        "What have you attempted to relieve it?",
        "Would another relevant person name the same constraint?",
      ],
      goodExample:
        "Yard capacity at peak is the limit. We see queues and delayed loads on Fridays. We tried staggered collections last month; it helped a bit.",
      poorExample: "The yard is our bottleneck. Everything is a bottleneck when it is busy.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview with evidence chain",
        "Any measure, example day, or attempted relief",
      ],
      maturityGuidance: {
        1: "No shared view of constraints, or pure opinion with no evidence.",
        2: "Vague sense of limits. Little action.",
        3: "Main bottleneck understood with some evidence and some response.",
        4: "Constraints are known from evidence and actively managed.",
      },
      confidenceGuidance: {
        high: "Claim plus evidence, effect, and relief attempt (or clear reason none was tried).",
        medium: "Claim plus partial evidence.",
        low: "Name only.",
      },
      diagnosticRelevance:
        "Unmanaged critical bottlenecks may justify Diagnostic.",
    },
    {
      id: "q5-resilience-recovery",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "After a bad day or week, how quickly does the branch get back to normal standards?",
      whyItMatters: "Tests recovery.",
      assessorPrompt: "After the last bad patch, how long until normal again?",
      followUpPrompts: [
        "What prioritised?",
        "What stayed broken?",
        "Customer impact duration?"
      ],
      goodExample: "Recovery deliberate and relatively quick.",
      poorExample: "It takes a while to settle.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview"
      ],
      maturityGuidance: {
        1: "Bad periods linger.",
        2: "Slow uneven recovery.",
        3: "Usually recovers in acceptable time.",
        4: "Fast managed recovery is normal.",
      },
      confidenceGuidance: {
        high: "Clear recovery story.",
        medium: "Vague.",
        low: "None.",
      },
      diagnosticRelevance: "Chronic failure to recover may justify Diagnostic.",
    }
  ],
  "communication-alignment": [
    {
      id: "q1-communication-priority",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question:
        "If you asked two different people what matters most operationally today, would you get the same answer?",
      whyItMatters:
        "Tests shared live operational understanding. This is not the same as leadership ownership (who owns standards). Here the test is whether people share the same operational priority today.",
      assessorPrompt: "What is the main operational priority today? Who else would give the same answer?",
      followUpPrompts: [
        "How was that priority set?",
        "How was it shared?",
        "What happens when priorities clash?",
      ],
      goodExample:
        "Manager and another person name the same priority in practical terms.",
      poorExample: "Everyone knows they need to work hard.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview two roles where available",
        "Any brief or board that states today's priority if used in practice",
      ],
      maturityGuidance: {
        1: "No shared priority. Conflicting stories.",
        2: "Partial alignment.",
        3: "Generally shared current priority.",
        4: "Tight alignment on what matters now.",
      },
      confidenceGuidance: {
        high: "Two consistent answers from different people.",
        medium: "One clear answer with a weak second check.",
        low: "Conflicting or empty answers.",
      },
      diagnosticRelevance:
        "Chronic misalignment may justify Diagnostic. Ownership of standards sits under Leadership, not this question.",
    },
    {
      id: "q2-communication-handover",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "How does important information pass between shifts or between warehouse and counter?",
      whyItMatters: "Tests handover of operational information.",
      assessorPrompt: "How do yesterday's problems reach today's team?",
      followUpPrompts: [
        "Verbal only?",
        "Written?",
        "What gets lost?"
      ],
      goodExample: "Handover routine and useful. Example passed and acted on.",
      poorExample: "We talk as we pass.",
      whatToObserve: [
        "Handover book or board if present"
      ],
      evidenceSuggestions: [
        "Interview",
        "Handover artefact"
      ],
      maturityGuidance: {
        1: "Handover unreliable.",
        2: "Informal and patchy.",
        3: "Handover usually works.",
        4: "Reliable handover discipline.",
      },
      confidenceGuidance: {
        high: "Artefact or clear example.",
        medium: "Claim only.",
        low: "None.",
      },
      diagnosticRelevance: "Broken handover may justify Diagnostic.",
    },
    {
      id: "q3-communication-up-down",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "How do floor problems reach the person who can act, and how do decisions come back?",
      whyItMatters: "Tests vertical operational communication.",
      assessorPrompt: "Give an example of a floor problem that needed a decision. How did it travel?",
      followUpPrompts: [
        "Speed?",
        "Distortion?",
        "Feedback to floor?"
      ],
      goodExample: "Problem reached the right person. Answer came back clearly.",
      poorExample: "They tell me eventually.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview with example"
      ],
      maturityGuidance: {
        1: "Problems stick or disappear.",
        2: "Slow or lossy path.",
        3: "Usually reaches the right person.",
        4: "Fast clear up-and-down communication.",
      },
      confidenceGuidance: {
        high: "Concrete example both ways.",
        medium: "One-way story.",
        low: "None.",
      },
      diagnosticRelevance: "Blocked escalation may justify Diagnostic.",
    },
    {
      id: "q4-communication-consistency",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "Do customers or staff get different answers depending on who they ask?",
      whyItMatters: "Tests consistency of operational messages.",
      assessorPrompt: "Where do people get mixed messages here?",
      followUpPrompts: [
        "Price, stock, timing, promises?",
        "Why?",
        "What have you done?"
      ],
      goodExample: "Mixed messages rare and challenged.",
      poorExample: "Depends who is on the counter.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview",
        "Observation if seen"
      ],
      maturityGuidance: {
        1: "Mixed messages common.",
        2: "Frequent friction.",
        3: "Mostly consistent answers.",
        4: "Consistent messages are normal.",
      },
      confidenceGuidance: {
        high: "Evidence of consistency or correction.",
        medium: "Anecdote only.",
        low: "No view.",
      },
      diagnosticRelevance: "Chronic mixed messages may justify Diagnostic.",
    },
    {
      id: "q5-communication-meetings",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "When the team meets or briefs, does it change how the day is run?",
      whyItMatters: "Tests whether forums produce operational effect.",
      assessorPrompt: "What is your regular brief, and what last changed because of it?",
      followUpPrompts: [
        "Attendance?",
        "Actions?",
        "Skipped when busy?"
      ],
      goodExample: "Briefs produce actions. Example of change from a meeting.",
      poorExample: "We have meetings when we can.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview",
        "Action note if any"
      ],
      maturityGuidance: {
        1: "No useful operational forum.",
        2: "Meetings with little effect.",
        3: "Useful enough briefs with some effect.",
        4: "Short effective operational communication is habitual.",
      },
      confidenceGuidance: {
        high: "Example of effect.",
        medium: "Description only.",
        low: "None.",
      },
      diagnosticRelevance: "Empty rituals may justify Diagnostic.",
    }
  ],
  "continuous-improvement-performance-management": [
    {
      id: "q1-ci-recurring",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "What operational problems keep coming back, and what has actually been done about them?",
      whyItMatters: "Tests improvement on recurring issues, not one-off complaint handling.",
      assessorPrompt: "Name a recurring problem. What changed since last time?",
      followUpPrompts: [
        "Measured?",
        "Who owns the fix?",
        "Why does it return?"
      ],
      goodExample: "Recurring issue named with a real change attempted and reviewed.",
      poorExample: "Same things crop up. We deal with them as they come.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview",
        "Action log if any"
      ],
      maturityGuidance: {
        1: "Recurring problems with no improvement attempt.",
        2: "Talk of improvement. Little change.",
        3: "Some recurring issues gripped and improved.",
        4: "Systematic handling of recurring problems.",
      },
      confidenceGuidance: {
        high: "Clear before and after example.",
        medium: "Weak example.",
        low: "None.",
      },
      diagnosticRelevance: "Chronic recurring failures may justify Diagnostic.",
    },
    {
      id: "q2-ci-measures",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "What numbers or simple signals do you actually use to run the branch?",
      whyItMatters: "Tests use of measures, not dashboard decoration.",
      assessorPrompt: "What do you look at weekly to know if operations are healthy?",
      followUpPrompts: [
        "Team see it?",
        "Change action?",
        "What is ignored?"
      ],
      goodExample: "A few meaningful signals used to act. Decision example.",
      poorExample: "We know how we are doing from experience.",
      whatToObserve: [
        "Boards or reports if present"
      ],
      evidenceSuggestions: [
        "Interview",
        "Sample KPI or board"
      ],
      maturityGuidance: {
        1: "No useful measures in use.",
        2: "Measures exist but rarely drive action.",
        3: "Some measures used in practice.",
        4: "Simple measures actively steer the branch.",
      },
      confidenceGuidance: {
        high: "Measure plus action example.",
        medium: "Measure without action.",
        low: "None.",
      },
      diagnosticRelevance: "Flying blind may justify Diagnostic.",
    },
    {
      id: "q3-ci-review",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "How do you review operational performance, and what happens after?",
      whyItMatters: "Tests review habit and follow-through.",
      assessorPrompt: "When did you last review how the branch is running, and what changed?",
      followUpPrompts: [
        "Who in the room?",
        "Actions?",
        "Follow-up?"
      ],
      goodExample: "Review with actions that were followed up.",
      poorExample: "We review when something goes wrong.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview",
        "Action notes"
      ],
      maturityGuidance: {
        1: "No real performance review.",
        2: "Reviews without action.",
        3: "Reviews happen and often produce action.",
        4: "Regular review with closed actions is normal.",
      },
      confidenceGuidance: {
        high: "Dated example with follow-up.",
        medium: "Vague.",
        low: "None.",
      },
      diagnosticRelevance: "No review cycle may justify Diagnostic.",
    },
    {
      id: "q4-ci-ideas",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question: "When staff suggest a better way of working, what happens?",
      whyItMatters: "Tests improvement input from the floor.",
      assessorPrompt: "Give an example of a staff idea. What did you do with it?",
      followUpPrompts: [
        "Welcomed?",
        "Who decides?",
        "Do people still suggest?"
      ],
      goodExample: "Idea taken seriously. Trial or clear reason for no.",
      poorExample: "They can always speak up.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview staff if possible"
      ],
      maturityGuidance: {
        1: "Ideas die. People stop offering.",
        2: "Occasional listen. Rare action.",
        3: "Ideas heard and sometimes used.",
        4: "Improvement input actively used.",
      },
      confidenceGuidance: {
        high: "Concrete idea path.",
        medium: "General claim.",
        low: "None.",
      },
      diagnosticRelevance: "Closed culture may justify Diagnostic.",
    },
    {
      id: "q5-ci-ownership",
      investigationRoute: "ASK_THEN_EVIDENCE",
      question:
        "Who owns making the branch better over time, not only keeping it running today?",
      whyItMatters:
        "Tests improvement ownership through a real change story, not a declaration that someone owns improvement.",
      assessorPrompt: "Give a specific improvement from the last period. What changed, why, who drove it, and what happened afterwards?",
      followUpPrompts: [
        "What was the problem before?",
        "Who drove the change?",
        "What is different now?",
        "How do you know it stuck?",
      ],
      goodExample:
        "Lost picks on aisle three kept recurring. Warehouse lead changed put-away labels in February. Error rate dropped and has stayed lower.",
      poorExample: "We are always looking to improve. We all own improvement.",
      whatToObserve: [],
      evidenceSuggestions: [
        "Interview with a specific improvement story",
        "Any before/after note or simple measure if used",
      ],
      maturityGuidance: {
        1: "No improvement ownership and no real change examples.",
        2: "Aspirational ownership. Weak or no follow-through.",
        3: "Someone owns improvement with some evidenced results.",
        4: "Active improvement ownership with clear change stories and results.",
      },
      confidenceGuidance: {
        high: "Specific story with who, why, and after-effect.",
        medium: "Partial story.",
        low: "Ownership claim only.",
      },
      diagnosticRelevance:
        "No improvement engine with declining performance may justify Diagnostic.",
    }
  ]
};
export const SCHEMA_VERSION = 13;

/** Product release version shown on the landing screen. Bump on every shipped update. */
export const APP_VERSION = "5.1.1";

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
 * permanent baseline -- it is never overwritten by Diagnostic activity.
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
    evidence: [], // { id, sourceType, content, capturedAt, questionId? }
    strengths: [],              // string[]
    opportunities: [],           // string[] -- no solution advice (Engine rule)
    professionalObservation: "",  // client-visible
    internalAssessorNotes: "",     // internal only
    maturityScore: null,            // 1-4, assessor-entered only, holistic per pillar
    assessorConfidence: null,        // { level: High|Medium|Low, reason }, holistic per pillar
    scoreHistory: [],                 // { score, setAt, stage, reason }

    // Methodology Engine v1.0: one response per question (see
    // PILLAR_QUESTIONS above), plus a lightweight evidenceNotes breadcrumb
    // captured while investigating that specific question. Keyed by
    // question id. Meaningful assessment data, not disposable UI notes --
    // persists exactly like every other field here. Neither generates a
    // score of its own; both inform the assessor's holistic
    // maturityScore/assessorConfidence above.
    //
    // evidenceNotes is deliberately NOT the formal evidence record -- it's
    // a quick note taken in the moment, distinct from the pillar-level
    // evidence[] array above (which has source classification and is
    // the assessor's considered, consolidated evidence).
    questionResponses: {}, // { [questionId]: { observed, learned, response?, evidenceNotes?, capturedAt } }
  };
}

/**
 * Creates a fresh per-cycle Diagnostic record for a single pillar.
 * Scoped entirely to one Diagnostic cycle -- investigating a pillar in
 * Cycle 1 and again in a later cycle produces two independent entries,
 * neither overwriting the other.
 */
export function createCyclePillarEntry() {
  return {
    status: "selected-not-started", // selected-not-started | in-progress | complete
    // Paid Diagnostic methodology (v5.1) - required for credible client report
    findings: "",              // What we found (evidence-based)
    whyItMatters: "",          // Consequence for the business
    rootCauseAnalysis: "",     // One main cause
    operationalRisk: "",       // Optional extra risk detail
    costOfInaction: "",        // Optional - only where evidence supports money/impact
    recommendations: [],       // { id, text, businessImpact: [] }
    doNotDo: [],               // { id, text } - what not to do
    implementationPlan: [],    // { id, step, timeframe }
  };
}

/** Fill missing Diagnostic fields on older cycle entries (additive migration). */
export function normalizeCyclePillarEntry(entry) {
  if (!entry || typeof entry !== "object") return createCyclePillarEntry();
  const base = createCyclePillarEntry();
  return {
    ...base,
    ...entry,
    findings: entry.findings ?? "",
    whyItMatters: entry.whyItMatters ?? "",
    doNotDo: Array.isArray(entry.doNotDo) ? entry.doNotDo : [],
    recommendations: Array.isArray(entry.recommendations) ? entry.recommendations : [],
    implementationPlan: Array.isArray(entry.implementationPlan) ? entry.implementationPlan : [],
  };
}

/** True when a pillar has the minimum content for a paid Diagnostic report. */
export function canCompleteDiagnosticPillar(entry) {
  const e = normalizeCyclePillarEntry(entry);
  const hasRec = e.recommendations.some((r) => (r.text || "").trim());
  const hasPlan = e.implementationPlan.some((s) => (s.step || "").trim());
  return (
    (e.findings || "").trim().length > 0 &&
    (e.whyItMatters || "").trim().length > 0 &&
    (e.rootCauseAnalysis || "").trim().length > 0 &&
    hasRec &&
    hasPlan
  );
}

/**
 * Creates a new Diagnostic Cycle. A Review may accumulate many cycles
 * over the organisation's improvement journey -- each is a self-contained
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
    locked: false, // true once this cycle is marked complete -- permanent, cycle-scoped only
    pillars: {}, // keyed by pillarKey -> createCyclePillarEntry()
    // Cycle-level synthesis for paid report (v5.1)
    connectedPicture: "",
    priorityAcrossCycle: "",
    successLooksLike: "",
    outOfScopeNotes: "",
  };
}

export function normalizeDiagnosticCycle(cycle) {
  if (!cycle || typeof cycle !== "object") return cycle;
  if (cycle.connectedPicture == null) cycle.connectedPicture = "";
  if (cycle.priorityAcrossCycle == null) cycle.priorityAcrossCycle = "";
  if (cycle.successLooksLike == null) cycle.successLooksLike = "";
  if (cycle.outOfScopeNotes == null) cycle.outOfScopeNotes = "";
  if (cycle.pillars) {
    for (const k of Object.keys(cycle.pillars)) {
      cycle.pillars[k] = normalizeCyclePillarEntry(cycle.pillars[k]);
    }
  }
  return cycle;
}

/**
 * Creates a new Review, with all ten PillarAssessments pre-created.
 * Governed by Assessment Engine v1.0. A Review represents an
 * organisation's ongoing improvement journey: one Health Review baseline,
 * followed by zero or more Diagnostic Cycles over time. The Review itself
 * is never locked -- only individual completed Diagnostic Cycles are.
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
    // once any previous cycle is locked (completed) -- this keeps "one
    // active cycle at a time" simple without preventing future cycles.
    diagnosticCycles: [],
    visitStartedAt: null,
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
