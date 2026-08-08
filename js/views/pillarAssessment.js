// ==========================================================================
// Keystone Field Kit — Pillar Assessment View
//
// Screen 6 of the locked Screen Map (Part 2 v1.0). Governed by Assessment
// Engine v1.0. Health Review layer always present; Diagnostic layer only
// once this pillar's diagnosticStatus is selected-not-started or beyond.
// ==========================================================================

import { getState, updateState } from "../state/store.js";
import { PILLARS, EVIDENCE_SOURCE_TYPES, CONFIDENCE_LEVELS, PILLAR_GUIDANCE } from "../state/schema.js";
import { createTextField } from "../components/textField.js";
import { createButton } from "../components/button.js";
import { createScoreSelector, SCORE_LABELS } from "../components/scoreSelector.js";
import { createTextListEditor, createEvidenceListEditor } from "../components/listEditor.js";
import { createGuidancePanel } from "../components/guidancePanel.js";
import { back } from "../router.js";

function findPillar(state, organisationId, reviewId, pillarKey) {
  const org = state.organisations.find((o) => o.id === organisationId);
  const review = org?.reviews.find((r) => r.id === reviewId);
  const pillar = review?.pillarAssessments.find((p) => p.pillarKey === pillarKey);
  return { org, review, pillar };
}

function mutatePillar(organisationId, reviewId, pillarKey, mutator) {
  updateState((state) => {
    const { review, pillar } = findPillar(state, organisationId, reviewId, pillarKey);
    if (!pillar) return state;
    mutator(pillar, review);
    review.lastUpdatedAt = new Date().toISOString();
    return state;
  });
}

function renderSummaryStrip(pillar, review) {
  const strip = document.createElement("div");
  strip.className = "summary-strip";

  const items = [
    ["Maturity score", pillar.maturityScore ? `${pillar.maturityScore} — ${SCORE_LABELS[pillar.maturityScore]}` : "Not yet scored"],
    ["Assessor confidence", pillar.assessorConfidence ? pillar.assessorConfidence.level : "Not set"],
    ["Evidence collected", `${pillar.evidence.length} item${pillar.evidence.length === 1 ? "" : "s"}`],
    ["Stage", review.stage === "diagnostic" ? "Operational Diagnostic" : "Operational Health Review"],
  ];

  items.forEach(([label, value]) => {
    const item = document.createElement("div");
    item.className = "summary-strip__item";
    const l = document.createElement("span");
    l.className = "summary-strip__label";
    l.textContent = label;
    const v = document.createElement("span");
    v.className = "summary-strip__value";
    v.textContent = value;
    item.append(l, v);
    strip.append(item);
  });

  return strip;
}

function renderHealthReviewLayer(container, pillar, review, org, refresh) {
  container.append(createGuidancePanel(PILLAR_GUIDANCE[pillar.pillarKey]));

  const obs = createTextField({ id: "observationNotes", label: "Observation notes", textarea: true });
  obs.input.value = pillar.observationNotes;
  obs.input.addEventListener("blur", () => {
    mutatePillar(org.id, review.id, pillar.pillarKey, (p) => (p.observationNotes = obs.input.value));
  });

  const conv = createTextField({ id: "conversationNotes", label: "Conversation notes", textarea: true });
  conv.input.value = pillar.conversationNotes;
  conv.input.addEventListener("blur", () => {
    mutatePillar(org.id, review.id, pillar.pillarKey, (p) => (p.conversationNotes = conv.input.value));
  });

  const evidenceLabel = document.createElement("p");
  evidenceLabel.className = "field__label";
  evidenceLabel.textContent = "Evidence";
  const evidenceEditor = createEvidenceListEditor({
    sourceTypes: EVIDENCE_SOURCE_TYPES,
    items: pillar.evidence,
    onChange: (items) => {
      mutatePillar(org.id, review.id, pillar.pillarKey, (p) => (p.evidence = items));
    },
  });

  const strengthsLabel = document.createElement("p");
  strengthsLabel.className = "field__label";
  strengthsLabel.textContent = "Strengths";
  const strengthsEditor = createTextListEditor({
    placeholder: "What is working well?",
    items: pillar.strengths,
    onChange: (items) => {
      mutatePillar(org.id, review.id, pillar.pillarKey, (p) => (p.strengths = items));
    },
  });

  const oppsLabel = document.createElement("p");
  oppsLabel.className = "field__label";
  oppsLabel.textContent = "Opportunities";
  const oppsHint = document.createElement("p");
  oppsHint.className = "text-caption";
  oppsHint.textContent = "Identify the opportunity without describing the solution.";
  const oppsEditor = createTextListEditor({
    placeholder: "Where could operational maturity improve?",
    items: pillar.opportunities,
    onChange: (items) => {
      mutatePillar(org.id, review.id, pillar.pillarKey, (p) => (p.opportunities = items));
    },
  });

  const profObs = createTextField({ id: "professionalObservation", label: "Professional observation (client-visible)", textarea: true });
  profObs.input.value = pillar.professionalObservation;
  profObs.input.addEventListener("blur", () => {
    mutatePillar(org.id, review.id, pillar.pillarKey, (p) => (p.professionalObservation = profObs.input.value));
  });

  const internalNotes = createTextField({ id: "internalAssessorNotes", label: "Internal assessor notes (never client-visible)", textarea: true });
  internalNotes.input.value = pillar.internalAssessorNotes;
  internalNotes.input.addEventListener("blur", () => {
    mutatePillar(org.id, review.id, pillar.pillarKey, (p) => (p.internalAssessorNotes = internalNotes.input.value));
  });

  const scoreLabel = document.createElement("p");
  scoreLabel.className = "field__label";
  scoreLabel.textContent = "Maturity score";
  const scoreSelector = createScoreSelector({
    value: pillar.maturityScore,
    onChange: (score) => {
      const previousScore = pillar.maturityScore;
      let reason = "";
      if (previousScore != null && previousScore !== score) {
        reason = window.prompt(
          `Revising score from ${previousScore} to ${score}. Please note the reason for this revision:`
        ) || "";
      }
      mutatePillar(org.id, review.id, pillar.pillarKey, (p) => {
        p.maturityScore = score;
        p.scoreHistory.push({
          score,
          setAt: new Date().toISOString(),
          stage: review.stage,
          reason: reason || (previousScore == null ? "Initial score" : ""),
        });
      });
      refresh();
    },
  });

  const confidenceLabel = document.createElement("p");
  confidenceLabel.className = "field__label";
  confidenceLabel.textContent = "Assessor confidence (internal only)";
  const confidenceRow = document.createElement("div");
  confidenceRow.className = "action-row";
  CONFIDENCE_LEVELS.forEach((level) => {
    const btn = createButton({
      label: level,
      variant: pillar.assessorConfidence?.level === level ? "primary" : "secondary",
      onClick: () => {
        const reason = window.prompt(`Reason for ${level} confidence (optional):`) || "";
        mutatePillar(org.id, review.id, pillar.pillarKey, (p) => {
          p.assessorConfidence = { level, reason };
        });
        refresh();
      },
    });
    confidenceRow.append(btn);
  });

  container.append(
    obs.element,
    conv.element,
    evidenceLabel,
    evidenceEditor,
    strengthsLabel,
    strengthsEditor,
    oppsLabel,
    oppsHint,
    oppsEditor,
    profObs.element,
    internalNotes.element,
    scoreLabel,
    scoreSelector,
    confidenceLabel,
    confidenceRow
  );
}

function renderDiagnosticLayer(container, pillar, review, org) {
  const divider = document.createElement("hr");
  divider.className = "section-divider";

  const heading = document.createElement("h2");
  heading.className = "text-heading-section";
  heading.textContent = "Operational Diagnostic";

  const rootCause = createTextField({ id: "rootCauseAnalysis", label: "Root cause analysis", textarea: true });
  rootCause.input.value = pillar.rootCauseAnalysis;
  rootCause.input.addEventListener("blur", () => {
    mutatePillar(org.id, review.id, pillar.pillarKey, (p) => (p.rootCauseAnalysis = rootCause.input.value));
  });

  const risk = createTextField({ id: "operationalRisk", label: "Operational risk", textarea: true });
  risk.input.value = pillar.operationalRisk;
  risk.input.addEventListener("blur", () => {
    mutatePillar(org.id, review.id, pillar.pillarKey, (p) => (p.operationalRisk = risk.input.value));
  });

  const cost = createTextField({ id: "costOfInaction", label: "Cost of inaction", textarea: true });
  cost.input.value = pillar.costOfInaction;
  cost.input.addEventListener("blur", () => {
    mutatePillar(org.id, review.id, pillar.pillarKey, (p) => (p.costOfInaction = cost.input.value));
  });

  const recLabel = document.createElement("p");
  recLabel.className = "field__label";
  recLabel.textContent = "Recommendations (client-visible, paid tier)";
  const recEditor = createTextListEditor({
    placeholder: "What should change?",
    items: pillar.recommendations.map((r) => r.text),
    onChange: (texts) => {
      mutatePillar(org.id, review.id, pillar.pillarKey, (p) => {
        p.recommendations = texts.map((text, i) => ({
          id: p.recommendations[i]?.id || `rec_${Date.now().toString(36)}_${i}`,
          text,
          businessImpact: [],
        }));
      });
    },
  });

  const planLabel = document.createElement("p");
  planLabel.className = "field__label";
  planLabel.textContent = "Implementation plan (client-visible, paid tier)";
  const planEditor = createTextListEditor({
    placeholder: "e.g. Week 1 — Develop briefing template",
    items: pillar.implementationPlan.map((s) => s.step),
    onChange: (steps) => {
      mutatePillar(org.id, review.id, pillar.pillarKey, (p) => {
        p.implementationPlan = steps.map((step, i) => ({
          id: p.implementationPlan[i]?.id || `plan_${Date.now().toString(36)}_${i}`,
          step,
          timeframe: p.implementationPlan[i]?.timeframe || "",
        }));
      });
    },
  });

  container.append(
    divider,
    heading,
    rootCause.element,
    risk.element,
    cost.element,
    recLabel,
    recEditor,
    planLabel,
    planEditor
  );
}

export function renderPillarAssessment(container, params) {
  const state = getState();
  const { org, review, pillar } = findPillar(
    state,
    params.organisationId,
    params.reviewId,
    params.pillarKey
  );

  const screen = document.createElement("div");
  screen.className = "screen stack";

  if (!org || !review || !pillar) {
    const notFound = document.createElement("p");
    notFound.className = "text-body-secondary";
    notFound.textContent = "Pillar assessment not found.";
    screen.append(notFound);
    container.append(screen);
    return;
  }

  const pillarMeta = PILLARS.find((p) => p.key === pillar.pillarKey);

  const heading = document.createElement("h1");
  heading.className = "text-heading-screen";
  heading.textContent = pillarMeta.name;

  const isLocked = review.diagnosticLocked;

  screen.append(heading, renderSummaryStrip(pillar, review));

  if (isLocked) {
    const lockedNotice = document.createElement("p");
    lockedNotice.className = "text-body-secondary";
    lockedNotice.textContent = "This review is complete and locked. No further edits are possible.";
    screen.append(lockedNotice);
    const actions = document.createElement("div");
    actions.className = "screen-actions";
    actions.append(createButton({ label: "Back", variant: "secondary", onClick: () => back() }));
    screen.append(actions);
    container.append(screen);
    return;
  }

  const form = document.createElement("div");
  form.className = "stack";

  function refresh() {
    container.innerHTML = "";
    renderPillarAssessment(container, params);
  }

  renderHealthReviewLayer(form, pillar, review, org, refresh);

  if (pillar.diagnosticStatus !== "not-selected") {
    renderDiagnosticLayer(form, pillar, review, org);
  }

  screen.append(form);

  const statusField = review.stage === "diagnostic" ? "diagnosticStatus" : "healthReviewStatus";
  const currentStatus = pillar[statusField];
  if (currentStatus === "not-started" || currentStatus === "selected-not-started") {
    mutatePillar(org.id, review.id, pillar.pillarKey, (p) => {
      p[statusField] = "in-progress";
    });
  }

  const actions = document.createElement("div");
  actions.className = "screen-actions stack-tight";

  const canComplete = pillar.evidence.length > 0 && pillar.maturityScore != null;

  const completeBtn = createButton({
    label: currentStatus === "complete" ? "Marked complete" : "Mark pillar complete",
    variant: "primary",
    onClick: () => {
      if (!canComplete) {
        window.alert(
          "A pillar cannot be marked complete until at least one piece of evidence and a maturity score are recorded."
        );
        return;
      }
      mutatePillar(org.id, review.id, pillar.pillarKey, (p) => {
        p[statusField] = "complete";
      });
      back();
    },
  });

  actions.append(completeBtn, createButton({ label: "Back", variant: "secondary", onClick: () => back() }));
  screen.append(actions);

  container.append(screen);
}
