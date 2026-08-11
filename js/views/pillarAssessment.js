/ ==========================================================================
// Keystone Field Kit -- Pillar Assessment View
//
// Screen 6 of the locked Screen Map (Part 2 v1.0). Governed by Assessment
// Engine v1.0 plus the Diagnostic Cycles architectural clarification.
//
// Health Review layer (params.pillarKey only) is the permanent baseline --
// always editable, never touched by Diagnostic activity.
//
// Diagnostic layer (params.pillarKey + params.cycleId) operates on that
// specific cycle's entry for this pillar -- separate storage per cycle, so
// investigating a pillar in one cycle never overwrites another cycle's
// findings on the same or a different pillar.
// ==========================================================================

import { getState, updateState } from "../state/store.js";
import {
  PILLARS,
  EVIDENCE_SOURCE_TYPES,
  CONFIDENCE_LEVELS,
  PILLAR_GUIDANCE,
  PILLAR_QUESTIONS,
} from "../state/schema.js";
import { createTextField } from "../components/textField.js";
import { createButton } from "../components/button.js";
import { createScoreSelector, SCORE_LABELS } from "../components/scoreSelector.js";
import { createTextListEditor, createEvidenceListEditor, createFreeTextAreaField } from "../components/listEditor.js";
import { createGuidancePanel } from "../components/guidancePanel.js";
import { createQuestionGuidance } from "../components/questionGuidance.js";
import { back } from "../router.js";

function findPillar(state, organisationId, reviewId, pillarKey) {
  const org = state.organisations.find((o) => o.id === organisationId);
  const review = org?.reviews.find((r) => r.id === reviewId);
  const pillar = review?.pillarAssessments.find((p) => p.pillarKey === pillarKey);
  return { org, review, pillar };
}

function findCycle(review, cycleId) {
  return review?.diagnosticCycles.find((c) => c.id === cycleId) || null;
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

function mutateCyclePillar(organisationId, reviewId, cycleId, pillarKey, mutator) {
  updateState((state) => {
    const { review } = findPillar(state, organisationId, reviewId, pillarKey);
    const cycle = findCycle(review, cycleId);
    const entry = cycle?.pillars[pillarKey];
    if (!entry) return state;
    mutator(entry);
    review.lastUpdatedAt = new Date().toISOString();
    return state;
  });
}


/**
 * In-page reason sheet. Replaces window.prompt on iPhone so the assessor
 * stays in context. Optional reason; empty is allowed.
 */
function askReason({ title, message, confirmLabel, onConfirm, onCancel }) {
  const existing = document.querySelector(".reason-sheet");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.className = "reason-sheet";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  const panel = document.createElement("div");
  panel.className = "reason-sheet__panel";

  const heading = document.createElement("p");
  heading.className = "reason-sheet__title";
  heading.textContent = title;

  const body = document.createElement("p");
  body.className = "reason-sheet__message";
  body.textContent = message;

  const input = document.createElement("textarea");
  input.className = "field__input reason-sheet__input";
  input.rows = 3;
  input.placeholder = "Optional note";

  const row = document.createElement("div");
  row.className = "reason-sheet__actions";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "btn btn-secondary";
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", () => {
    overlay.remove();
    if (onCancel) onCancel();
  });

  const okBtn = document.createElement("button");
  okBtn.type = "button";
  okBtn.className = "btn btn-primary";
  okBtn.textContent = confirmLabel || "Save";
  okBtn.addEventListener("click", () => {
    const value = input.value.trim();
    overlay.remove();
    onConfirm(value);
  });

  row.append(cancelBtn, okBtn);
  panel.append(heading, body, input, row);
  overlay.append(panel);
  document.body.append(overlay);
  input.focus();
}

function renderSummaryStrip(pillar, isDiagnosticMode, cycle) {
  const wrap = document.createElement("div");
  wrap.className = "stack-tight";

  const strip = document.createElement("div");
  strip.className = "summary-strip";

  const items = [
    ["Maturity score", pillar.maturityScore ? `${pillar.maturityScore} (${SCORE_LABELS[pillar.maturityScore]})` : "Not yet scored"],
    ["Assessor confidence", pillar.assessorConfidence ? pillar.assessorConfidence.level : "Not set"],
    ["Evidence collected", `${pillar.evidence.length} item${pillar.evidence.length === 1 ? "" : "s"}`],
    ["Stage", isDiagnosticMode ? `Operational Diagnostic, Cycle ${cycle.cycleNumber}` : "Operational Health Review"],
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

  wrap.append(strip);

  // Health Review only: quiet readiness based on the same rules as Mark complete
  // (evidence + maturity score). Confidence is shown as a soft note if missing.
  if (!isDiagnosticMode) {
    const ready = document.createElement("p");
    ready.className = "pillar-ready text-caption";
    const hasEvidence = pillar.evidence.length > 0;
    const hasScore = pillar.maturityScore != null;
    const hasConfidence = Boolean(pillar.assessorConfidence?.level);

    if (hasEvidence && hasScore) {
      ready.textContent = hasConfidence
        ? "Ready to mark this pillar complete"
        : "Ready to mark complete. Confidence still optional but useful.";
      ready.classList.add("pillar-ready--ok");
    } else {
      const missing = [];
      if (!hasEvidence) missing.push("evidence");
      if (!hasScore) missing.push("maturity score");
      ready.textContent = "Still needed: " + missing.join(" and ");
    }
    wrap.append(ready);
  }

  return wrap;
}

/**
 * Renders the pillar's methodology questions (Methodology Engine v1.0).
 * Each question gets one auto-growing response field plus its full
 * guidance chain. Empty array for pillars not yet authored -- renders
 * nothing, no regression for the other nine pillars.
 */
function renderMethodologyQuestions(container, pillar, review, org) {
  const questions = PILLAR_QUESTIONS[pillar.pillarKey] || [];

  const sectionHeading = document.createElement("h2");
  sectionHeading.className = "text-heading-section";
  sectionHeading.textContent = "Questions";
  container.append(sectionHeading);

  if (questions.length === 0) {
    const empty = document.createElement("p");
    empty.className = "text-body-secondary pillar-questions-empty";
    empty.textContent =
      "Assessment questions for this pillar are not authored yet. Use evidence and professional judgement below.";
    container.append(empty);
    return;
  }

  questions.forEach((q) => {
    const questionWrap = document.createElement("div");
    questionWrap.className = "question-block stack-tight";

    const questionText = document.createElement("p");
    questionText.className = "question-block__text";
    questionText.textContent = q.question;

    const existing = pillar.questionResponses?.[q.id];

    // Merges into the existing entry rather than replacing it outright,
    // so the response and evidenceNotes fields (saved independently, on
    // their own blur events) never clobber one another.
    function saveQuestionField(fieldName, value) {
      mutatePillar(org.id, review.id, pillar.pillarKey, (p) => {
        if (!p.questionResponses) p.questionResponses = {};
        const current = p.questionResponses[q.id] || { response: "", evidenceNotes: "", capturedAt: null };
        p.questionResponses[q.id] = {
          ...current,
          [fieldName]: value,
          // Set once, on first capture, and preserved on every subsequent
          // edit. Represents when this question was first investigated,
          // not when it was last touched -- future Health Check work may
          // rely on this original capture point longitudinally.
          capturedAt: current.capturedAt || new Date().toISOString(),
        };
      });
    }

    const responseField = createTextField({
      id: `question-${q.id}`,
      label: "Response",
      textarea: true,
    });
    responseField.input.value = existing ? existing.response : "";
    responseField.input.rows = 3;
    responseField.input.addEventListener("input", () => {
      responseField.input.style.height = "auto";
      responseField.input.style.height = `${responseField.input.scrollHeight}px`;
    });
    responseField.input.addEventListener("blur", () => {
      saveQuestionField("response", responseField.input.value);
    });

    // Lightweight breadcrumb, not the formal evidence record. The full
    // multi-entry, source-classified Evidence list stays under Pillar
    // Assessment at the bottom, untouched -- this is just a quick note
    // taken in the moment while investigating this specific question.
    const evidenceNotesField = createTextField({
      id: `question-evidence-${q.id}`,
      label: "Evidence / examples from this question",
      textarea: true,
    });
    evidenceNotesField.input.value = existing ? existing.evidenceNotes || "" : "";
    evidenceNotesField.input.rows = 2;
    evidenceNotesField.input.placeholder = "e.g. \"Opening checklist seen, entrance signage poor.\"";
    evidenceNotesField.element.classList.add("question-evidence-notes");
    evidenceNotesField.input.addEventListener("input", () => {
      evidenceNotesField.input.style.height = "auto";
      evidenceNotesField.input.style.height = `${evidenceNotesField.input.scrollHeight}px`;
    });
    evidenceNotesField.input.addEventListener("blur", () => {
      saveQuestionField("evidenceNotes", evidenceNotesField.input.value);
    });

    questionWrap.append(
      questionText,
      responseField.element,
      createQuestionGuidance(q),
      evidenceNotesField.element
    );
    container.append(questionWrap);
  });

  const divider = document.createElement("hr");
  divider.className = "section-divider";
  container.append(divider);
}

function renderHealthReviewLayer(container, pillar, review, org, refresh) {
  const guidance = PILLAR_GUIDANCE[pillar.pillarKey];

  renderMethodologyQuestions(container, pillar, review, org);

  // Observation Notes and Conversation Notes are deliberately hidden from
  // the active Health Review UI (not deleted). Their purpose is now
  // fully covered by the question layer above (response + evidence
  // breadcrumb, per question) -- keeping them visible risked duplicate
  // entry or assessor confusion about which box to use. The underlying
  // schema fields (pillar.observationNotes / pillar.conversationNotes)
  // are untouched: existing Reviews with data in them are preserved,
  // neither field is required for pillar completion, and neither is
  // referenced by any report. Reinstating the UI later needs no schema
  // change if a legitimate future use is found.

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
  const strengthsEditor = createFreeTextAreaField({
    placeholder: "What is working well? One point per line.",
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
  oppsHint.textContent = "Name the gap or inconsistency, not the fix. One point per line.";
  const oppsEditor = createFreeTextAreaField({
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
  internalNotes.element.classList.add("field--internal");
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

      function commit(reason) {
        mutatePillar(org.id, review.id, pillar.pillarKey, (p) => {
          p.maturityScore = score;
          p.scoreHistory.push({
            score,
            setAt: new Date().toISOString(),
            reason: reason || (previousScore == null ? "Initial score" : ""),
          });
        });
        refresh();
      }

      if (previousScore != null && previousScore !== score) {
        askReason({
          title: "Score revision",
          message: `Changing from ${previousScore} to ${score}. A short note helps if you revisit this later.`,
          confirmLabel: "Save score",
          onConfirm: commit,
        });
        return;
      }
      commit("");
    },
  });

  const confidenceLabel = document.createElement("p");
  confidenceLabel.className = "field__label";
  confidenceLabel.textContent = "Assessor confidence (internal only)";
  const confidenceRow = document.createElement("div");
  confidenceRow.className = "confidence-row";
  CONFIDENCE_LEVELS.forEach((level) => {
    const selected = pillar.assessorConfidence?.level === level;
    const btn = createButton({
      label: level,
      variant: selected ? "primary" : "secondary",
      onClick: () => {
        // First selection: save immediately. Changing level: optional note.
        const previous = pillar.assessorConfidence?.level;
        function commit(reason) {
          mutatePillar(org.id, review.id, pillar.pillarKey, (p) => {
            p.assessorConfidence = { level, reason: reason || "" };
          });
          refresh();
        }
        if (previous && previous !== level) {
          askReason({
            title: "Confidence change",
            message: `Changing from ${previous} to ${level}. Optional note for your own reference.`,
            confirmLabel: "Save",
            onConfirm: commit,
          });
          return;
        }
        commit(pillar.assessorConfidence?.reason || "");
      },
    });
    if (selected) btn.classList.add("confidence-row__selected");
    confidenceRow.append(btn);
  });

  // Guidance is attached directly under the field it supports. The four
  // panels below (Observation, Conversation, Evidence, Strengths) are
  // hidden here, not deleted -- their PILLAR_GUIDANCE entries in schema.js
  // are untouched and still empty placeholders, ready to be populated and
  // re-shown later. They're hidden because they currently render nothing
  // but "Not yet added" ten times each: pure clutter, independent of any
  // redundancy question. Opportunities, Professional Observation,
  // Maturity Score and Assessor Confidence guidance remain visible -- each
  // has genuinely populated, non-duplicated content the question-level
  // guidance doesn't cover.
  const pillarAssessmentHeading = document.createElement("h2");
  pillarAssessmentHeading.className = "text-heading-section";
  pillarAssessmentHeading.textContent = "Your judgement";

  container.append(
    pillarAssessmentHeading,
    evidenceLabel,
    evidenceEditor,
    strengthsLabel,
    strengthsEditor,
    oppsLabel,
    oppsHint,
    oppsEditor,
    createGuidancePanel(guidance.opportunities),
    profObs.element,
    createGuidancePanel(guidance.professionalObservation),
    internalNotes.element,
    scoreLabel,
    scoreSelector,
    createGuidancePanel(guidance.maturityScore),
    confidenceLabel,
    confidenceRow,
    createGuidancePanel(guidance.assessorConfidence)
  );
}

function renderDiagnosticLayer(container, pillarKey, cycleEntry, review, org, cycleId, refresh) {
  const divider = document.createElement("hr");
  divider.className = "section-divider";

  const heading = document.createElement("h2");
  heading.className = "text-heading-section";
  heading.textContent = "Operational Diagnostic";

  const rootCause = createTextField({ id: "rootCauseAnalysis", label: "Root cause analysis", textarea: true });
  rootCause.input.value = cycleEntry.rootCauseAnalysis;
  rootCause.input.addEventListener("blur", () => {
    mutateCyclePillar(org.id, review.id, cycleId, pillarKey, (e) => (e.rootCauseAnalysis = rootCause.input.value));
  });

  const risk = createTextField({ id: "operationalRisk", label: "Operational risk", textarea: true });
  risk.input.value = cycleEntry.operationalRisk;
  risk.input.addEventListener("blur", () => {
    mutateCyclePillar(org.id, review.id, cycleId, pillarKey, (e) => (e.operationalRisk = risk.input.value));
  });

  const cost = createTextField({ id: "costOfInaction", label: "Cost of inaction", textarea: true });
  cost.input.value = cycleEntry.costOfInaction;
  cost.input.addEventListener("blur", () => {
    mutateCyclePillar(org.id, review.id, cycleId, pillarKey, (e) => (e.costOfInaction = cost.input.value));
  });

  const recLabel = document.createElement("p");
  recLabel.className = "field__label";
  recLabel.textContent = "Recommendations (client-visible, paid tier)";
  const recEditor = createTextListEditor({
    placeholder: "What should change?",
    items: cycleEntry.recommendations.map((r) => r.text),
    onChange: (texts) => {
      mutateCyclePillar(org.id, review.id, cycleId, pillarKey, (e) => {
        e.recommendations = texts.map((text, i) => ({
          id: e.recommendations[i]?.id || `rec_${Date.now().toString(36)}_${i}`,
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
    placeholder: "e.g. Week 1: Develop briefing template",
    items: cycleEntry.implementationPlan.map((s) => s.step),
    onChange: (steps) => {
      mutateCyclePillar(org.id, review.id, cycleId, pillarKey, (e) => {
        e.implementationPlan = steps.map((step, i) => ({
          id: e.implementationPlan[i]?.id || `plan_${Date.now().toString(36)}_${i}`,
          step,
          timeframe: e.implementationPlan[i]?.timeframe || "",
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

  const isDiagnosticMode = Boolean(params.cycleId);
  const cycle = isDiagnosticMode ? findCycle(review, params.cycleId) : null;

  if (isDiagnosticMode && !cycle) {
    const notFound = document.createElement("p");
    notFound.className = "text-body-secondary";
    notFound.textContent = "Diagnostic cycle not found.";
    screen.append(notFound);
    container.append(screen);
    return;
  }

  const cycleEntry = isDiagnosticMode ? cycle.pillars[pillar.pillarKey] : null;
  if (isDiagnosticMode && !cycleEntry) {
    const notFound = document.createElement("p");
    notFound.className = "text-body-secondary";
    notFound.textContent = "This pillar is not selected for this Diagnostic cycle.";
    screen.append(notFound);
    container.append(screen);
    return;
  }

  const pillarMeta = PILLARS.find((p) => p.key === pillar.pillarKey);

  const heading = document.createElement("h1");
  heading.className = "text-heading-screen";
  heading.textContent = pillarMeta.name;

  screen.append(heading, renderSummaryStrip(pillar, isDiagnosticMode, cycle));

  // Only the active cycle's own Diagnostic content locks when that cycle
  // completes. The Health Review layer is never locked by this.
  const diagnosticLocked = isDiagnosticMode && cycle.locked;

  const form = document.createElement("div");
  form.className = "stack";

  function refresh() {
    container.innerHTML = "";
    renderPillarAssessment(container, params);
  }

  if (isDiagnosticMode) {
    if (diagnosticLocked) {
      const lockedNotice = document.createElement("p");
      lockedNotice.className = "text-body-secondary";
      lockedNotice.textContent = `Diagnostic Cycle ${cycle.cycleNumber} is complete and locked. This cycle's findings are a permanent historical record.`;
      form.append(lockedNotice);
    } else {
      renderDiagnosticLayer(form, pillar.pillarKey, cycleEntry, review, org, cycle.id, refresh);
    }
  } else {
    // Health Review layer -- always editable, the permanent baseline.
    renderHealthReviewLayer(form, pillar, review, org, refresh);
  }

  screen.append(form);

  // Mark in-progress the moment the assessor opens a not-started item.
  if (isDiagnosticMode && !diagnosticLocked) {
    if (cycleEntry.status === "selected-not-started") {
      mutateCyclePillar(org.id, review.id, cycle.id, pillar.pillarKey, (e) => {
        e.status = "in-progress";
      });
    }
  } else if (!isDiagnosticMode && pillar.healthReviewStatus === "not-started") {
    mutatePillar(org.id, review.id, pillar.pillarKey, (p) => {
      p.healthReviewStatus = "in-progress";
    });
  }

  const actions = document.createElement("div");
  actions.className = "screen-actions stack-tight";

  if (!diagnosticLocked) {
    if (isDiagnosticMode) {
      const currentStatus = cycleEntry.status;
      const completeBtn = createButton({
        label: currentStatus === "complete" ? "Marked complete" : "Mark pillar complete",
        variant: "primary",
        onClick: () => {
          mutateCyclePillar(org.id, review.id, cycle.id, pillar.pillarKey, (e) => {
            e.status = "complete";
          });
          back();
        },
      });
      actions.append(completeBtn);
    } else {
      const currentStatus = pillar.healthReviewStatus;
      const canComplete = pillar.evidence.length > 0 && pillar.maturityScore != null;
      const completeBtn = createButton({
        label: currentStatus === "complete" ? "Marked complete" : "Mark pillar complete",
        variant: "primary",
        onClick: () => {
          if (!canComplete) {
            window.alert(
              "Add at least one piece of evidence and a maturity score before marking this pillar complete."
            );
            return;
          }
          mutatePillar(org.id, review.id, pillar.pillarKey, (p) => {
            p.healthReviewStatus = "complete";
          });
          back();
        },
      });
      actions.append(completeBtn);
    }
  }

  actions.append(createButton({ label: "Back", variant: "secondary", onClick: () => back() }));
  screen.append(actions);

  container.append(screen);
}

