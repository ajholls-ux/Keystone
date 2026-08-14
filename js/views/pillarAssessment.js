// ==========================================================================
// Keystone Field Kit -- Pillar Assessment View
//
// Screen 6 of the locked Screen Map (Part 2 v1.0).
//
// UX PRINCIPLE
// --------------------------------------------------------------------------
// Investigation captures the facts.
// Your judgement interprets those facts.
//
// The "From this pillar" briefing is contextual. It appears immediately
// above the judgement field currently being worked on.
//
// It is deliberately NOT a copy/paste system.
// The assessor must make their own professional judgement.
// ==========================================================================

import { getState, updateState } from "../state/store.js";
import {
  PILLARS,
  EVIDENCE_SOURCE_TYPES,
  CONFIDENCE_LEVELS,
  PILLAR_GUIDANCE,
  PILLAR_QUESTIONS,
  canCompleteDiagnosticPillar,
  normalizeCyclePillarEntry,
  normalizeDiagnosticCycle,
} from "../state/schema.js";

import { createTextField } from "../components/textField.js";
import { createButton } from "../components/button.js";
import {
  createScoreSelector,
  SCORE_LABELS,
} from "../components/scoreSelector.js";

import {
  createTextListEditor,
  createEvidenceListEditor,
  createFreeTextAreaField,
} from "../components/listEditor.js";

import { createGuidancePanel } from "../components/guidancePanel.js";
import { createQuestionGuidance } from "../components/questionGuidance.js";
import { back } from "../router.js";

// ==========================================================================
// DATA HELPERS
// ==========================================================================

function findPillar(
  state,
  organisationId,
  reviewId,
  pillarKey
) {
  const org = state.organisations.find(
    (o) => o.id === organisationId
  );

  const review = org?.reviews.find(
    (r) => r.id === reviewId
  );

  const pillar = review?.pillarAssessments.find(
    (p) => p.pillarKey === pillarKey
  );

  return {
    org,
    review,
    pillar,
  };
}

function findCycle(review, cycleId) {
  return (
    review?.diagnosticCycles.find(
      (c) => c.id === cycleId
    ) || null
  );
}

function mutatePillar(
  organisationId,
  reviewId,
  pillarKey,
  mutator
) {
  updateState((state) => {
    const {
      review,
      pillar,
    } = findPillar(
      state,
      organisationId,
      reviewId,
      pillarKey
    );

    if (!pillar) return state;

    mutator(pillar, review);

    review.lastUpdatedAt =
      new Date().toISOString();

    return state;
  });
}

function mutateCyclePillar(
  organisationId,
  reviewId,
  cycleId,
  pillarKey,
  mutator
) {
  updateState((state) => {
    const {
      review,
    } = findPillar(
      state,
      organisationId,
      reviewId,
      pillarKey
    );

    const cycle =
      findCycle(
        review,
        cycleId
      );

    const entry =
      cycle?.pillars[pillarKey];

    if (!entry) return state;

    mutator(entry);

    review.lastUpdatedAt =
      new Date().toISOString();

    return state;
  });
}

// ==========================================================================
// REASON SHEET
// ==========================================================================

function askReason({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}) {
  const existing =
    document.querySelector(
      ".reason-sheet"
    );

  if (existing) {
    existing.remove();
  }

  const overlay =
    document.createElement("div");

  overlay.className =
    "reason-sheet";

  overlay.setAttribute(
    "role",
    "dialog"
  );

  overlay.setAttribute(
    "aria-modal",
    "true"
  );

  const panel =
    document.createElement("div");

  panel.className =
    "reason-sheet__panel";

  const heading =
    document.createElement("p");

  heading.className =
    "reason-sheet__title";

  heading.textContent =
    title;

  const body =
    document.createElement("p");

  body.className =
    "reason-sheet__message";

  body.textContent =
    message;

  const input =
    document.createElement("textarea");

  input.className =
    "field__input reason-sheet__input";

  input.rows = 3;

  input.placeholder =
    "Optional note";

  const row =
    document.createElement("div");

  row.className =
    "reason-sheet__actions";

  const cancelBtn =
    document.createElement("button");

  cancelBtn.type = "button";

  cancelBtn.className =
    "btn btn-secondary";

  cancelBtn.textContent =
    "Cancel";

  cancelBtn.addEventListener(
    "click",
    () => {
      overlay.remove();

      if (onCancel) {
        onCancel();
      }
    }
  );

  const okBtn =
    document.createElement("button");

  okBtn.type = "button";

  okBtn.className =
    "btn btn-primary";

  okBtn.textContent =
    confirmLabel || "Save";

  okBtn.addEventListener(
    "click",
    () => {
      const value =
        input.value.trim();

      overlay.remove();

      onConfirm(value);
    }
  );

  row.append(
    cancelBtn,
    okBtn
  );

  panel.append(
    heading,
    body,
    input,
    row
  );

  overlay.append(panel);

  document.body.append(
    overlay
  );

  input.focus();
}

// ==========================================================================
// SUMMARY STRIP
// ==========================================================================

function renderSummaryStrip(
  pillar,
  isDiagnosticMode,
  cycle
) {
  const wrap =
    document.createElement("div");

  wrap.className =
    "stack-tight";

  const strip =
    document.createElement("div");

  strip.className =
    "summary-strip";

  const items = [
    [
      "Maturity score",
      pillar.maturityScore
        ? `${pillar.maturityScore} (${SCORE_LABELS[pillar.maturityScore]})`
        : "Not yet scored",
    ],

    [
      "Assessor confidence",
      pillar.assessorConfidence
        ? pillar.assessorConfidence.level
        : "Not set",
    ],

    [
      "Evidence collected",
      `${pillar.evidence.length} item${
        pillar.evidence.length === 1
          ? ""
          : "s"
      }`,
    ],

    [
      "Stage",
      isDiagnosticMode
        ? `Operational Diagnostic, Cycle ${cycle.cycleNumber}`
        : "Operational Health Review",
    ],
  ];

  items.forEach(
    ([label, value]) => {
      const item =
        document.createElement(
          "div"
        );

      item.className =
        "summary-strip__item";

      const l =
        document.createElement(
          "span"
        );

      l.className =
        "summary-strip__label";

      l.textContent =
        label;

      const v =
        document.createElement(
          "span"
        );

      v.className =
        "summary-strip__value";

      v.textContent =
        value;

      item.append(
        l,
        v
      );

      strip.append(
        item
      );
    }
  );

  wrap.append(
    strip
  );

  if (!isDiagnosticMode) {
    const ready =
      document.createElement(
        "p"
      );

    ready.className =
      "pillar-ready text-caption";

    const hasEvidence =
      pillar.evidence.length > 0;

    const hasScore =
      pillar.maturityScore != null;

    const hasConfidence =
      Boolean(
        pillar.assessorConfidence
          ?.level
      );

    if (
      hasEvidence &&
      hasScore
    ) {
      ready.textContent =
        hasConfidence
          ? "Ready to mark this pillar complete"
          : "Ready to mark complete. Confidence still optional but useful.";

      ready.classList.add(
        "pillar-ready--ok"
      );
    } else {
      const missing = [];

      if (!hasEvidence) {
        missing.push(
          "evidence"
        );
      }

      if (!hasScore) {
        missing.push(
          "maturity score"
        );
      }

      ready.textContent =
        "Still needed: " +
        missing.join(
          " and "
        );
    }

    wrap.append(
      ready
    );
  }

  return wrap;
}

// ==========================================================================
// METHODOLOGY QUESTIONS
// ==========================================================================

function getPillarPhase(pillarKey) {
  try {
    const v = sessionStorage.getItem("keystone_phase_" + pillarKey);
    if (v === "observe" || v === "discussion") return v;
  } catch (_) {}
  return "observe";
}

function setPillarPhase(pillarKey, phase) {
  try {
    sessionStorage.setItem("keystone_phase_" + pillarKey, phase);
  } catch (_) {}
}

function renderMethodologyQuestions(container, pillar, review, org, refresh) {
  const questions = PILLAR_QUESTIONS[pillar.pillarKey] || [];
  const phase = getPillarPhase(pillar.pillarKey);

  const sectionHeading = document.createElement("h2");
  sectionHeading.className = "text-heading-section";
  sectionHeading.textContent = "Questions";
  container.append(sectionHeading);

  // Phase control: Observe vs Discussion (same questions, different emphasis)
  const phaseBar = document.createElement("div");
  phaseBar.className = "phase-bar";

  const phaseHint = document.createElement("p");
  phaseHint.className = "text-caption phase-bar__hint";
  phaseHint.textContent =
    phase === "observe"
      ? "Observe mode. Write one short factual line before you leave each area. Discussion comes after."
      : "Discussion mode. Read what you observed, then ask. Observed notes stay visible so you do not rely on memory.";

  const phaseRow = document.createElement("div");
  phaseRow.className = "phase-bar__buttons";

  ["observe", "discussion"].forEach((mode) => {
    const selected = phase === mode;
    const btn = createButton({
      label: mode === "observe" ? "Observe" : "Discussion",
      variant: selected ? "primary" : "secondary",
      onClick: () => {
        setPillarPhase(pillar.pillarKey, mode);
        refresh();
      },
    });
    if (selected) btn.classList.add("phase-bar__selected");
    phaseRow.append(btn);
  });

  phaseBar.append(phaseHint, phaseRow);
  container.append(phaseBar);

  if (questions.length === 0) {
    const empty = document.createElement("p");
    empty.className = "text-body-secondary pillar-questions-empty";
    empty.textContent =
      "Assessment questions for this pillar are not authored yet. Capture evidence under Your judgement below, then score the pillar.";
    container.append(empty);
    return;
  }

  const PLACEHOLDERS = {
    "q1-first-impression": {
      observed: "e.g. Entrance tidy, signage inconsistent, no staff visible on arrival.",
      learned: "e.g. Manager says duty supervisor signs a daily check. No checklist seen.",
    },
    "q2-wayfinding-responsiveness": {
      observed: "e.g. Aisle signs unclear, customers looking lost, staff hard to find on the floor.",
      learned: "e.g. Staff say they help when asked. No set coverage for the trade counter at peak.",
    },
    "q3-complaint-issue-handling": {
      observed: "",
      learned: "e.g. Last complaint was last month. Branch manager owned it. Not clear if it was logged.",
    },
    "q4-customer-satisfaction-awareness": {
      observed: "",
      learned: "e.g. Owner knows regulars by name and notices when someone stops calling. No formal survey.",
    },
    "q5-consistency-of-interaction": {
      observed: "e.g. One colleague greeted well and knew the product; another barely looked up.",
      learned: "e.g. Service is picked up on the job. No shared standard beyond 'be helpful'.",
    },
  };

  questions.forEach((q) => {
    const questionWrap = document.createElement("div");
    questionWrap.className = "question-block stack-tight";
    questionWrap.dataset.phase = phase;

    const route = q.investigationRoute || "ASK_THEN_EVIDENCE";
    const observeFirst =
      route === "OBSERVE_THEN_ASK" || route === "OBSERVE_ASK_EVIDENCE";

    const existing = pillar.questionResponses?.[q.id] || {};
    const existingObserved = existing.observed || "";
    const existingLearned = existing.learned || existing.response || "";
    const ph = PLACEHOLDERS[q.id] || {
      observed: "Short factual notes on what you saw. A sentence or two is enough.",
      learned: "What the manager or staff told you. Keep it brief.",
    };

    function saveResponse(field, value) {
      mutatePillar(org.id, review.id, pillar.pillarKey, (p) => {
        if (!p.questionResponses) p.questionResponses = {};
        const prev = p.questionResponses[q.id] || {};
        p.questionResponses[q.id] = {
          ...prev,
          [field]: value,
        };
      });
    }

    const qText = document.createElement("p");
    qText.className = "question-block__text";
    qText.textContent = q.question;
    questionWrap.append(qText);

    // --- OBSERVED ---
    if (observeFirst) {
      const observeBlock = document.createElement("div");
      observeBlock.className = "question-observed";

      const observeLabel = document.createElement("p");
      observeLabel.className = "field__label";
      observeLabel.textContent =
        phase === "discussion" ? "What I observed (from the floor)" : "What I observed";

      if (phase === "discussion") {
        const observedRead = document.createElement("div");
        observedRead.className = "question-observed-readonly";
        if (existingObserved.trim()) {
          observedRead.textContent = existingObserved;
        } else {
          observedRead.classList.add("question-observed-readonly--empty");
          observedRead.textContent =
            "No observation recorded yet. Switch to Observe if you still need to capture what you saw.";
        }
        observeBlock.append(observeLabel, observedRead);
      } else {
        const observeHint = document.createElement("p");
        observeHint.className = "text-caption";
        observeHint.textContent =
          "One short factual line is enough before you leave this area.";

        if (q.whatToObserve && q.whatToObserve.length) {
          const lookFor = document.createElement("p");
          lookFor.className = "text-caption question-block__look-for";
          lookFor.textContent = "Look for: " + q.whatToObserve.join(", ");
          observeBlock.append(observeLabel, observeHint, lookFor);
        } else {
          observeBlock.append(observeLabel, observeHint);
        }

        const observedField = createTextField({
          id: "observed-" + q.id,
          label: "",
          textarea: true,
        });
        observedField.input.placeholder = ph.observed;
        observedField.input.value = existingObserved;
        observedField.input.addEventListener("blur", () => {
          saveResponse("observed", observedField.input.value);
        });
        observeBlock.append(observedField.element);
      }

      questionWrap.append(observeBlock);
    }

    // --- LEARNED (Discussion mode, or ask-first always) ---
    const showLearned = phase === "discussion" || !observeFirst;
    if (showLearned) {
      if (observeFirst && phase === "discussion") {
        const askCue = document.createElement("p");
        askCue.className = "question-block__ask-cue";
        askCue.textContent = "Then ask";
        questionWrap.append(askCue);
      }

      const learnedLabel = document.createElement("p");
      learnedLabel.className = "field__label";
      learnedLabel.textContent = "What I learned";

      const learnedHint = document.createElement("p");
      learnedHint.className = "text-caption";
      learnedHint.textContent = observeFirst
        ? "What the manager or staff said when you checked what you saw."
        : "What you learned from asking and any evidence they could show.";

      const learnedField = createTextField({
        id: "learned-" + q.id,
        label: "",
        textarea: true,
      });
      learnedField.input.placeholder = ph.learned;
      learnedField.input.value = existingLearned;
      learnedField.input.addEventListener("blur", () => {
        saveResponse("learned", learnedField.input.value);
      });

      const learnedBlock = document.createElement("div");
      learnedBlock.className = "question-learned";
      learnedBlock.append(learnedLabel, learnedHint, learnedField.element);
      questionWrap.append(learnedBlock);
    } else if (observeFirst && phase === "observe") {
      const later = document.createElement("p");
      later.className = "text-caption question-block__later";
      later.textContent = "Discussion (what you learned) is available when you switch to Discussion.";
      questionWrap.append(later);
    }

    // --- EVIDENCE (both modes; useful while walking and at table) ---
    const evLabel = document.createElement("p");
    evLabel.className = "field__label";
    evLabel.textContent = "Evidence";

    const evHint = document.createElement("p");
    evHint.className = "text-caption";
    evHint.textContent =
      "Optional. Add only what supports this question. Source required.";

    const questionEvidence = (pillar.evidence || []).filter(
      (e) => e.questionId === q.id
    );

    const evidenceEditor = createEvidenceListEditor({
      sourceTypes: EVIDENCE_SOURCE_TYPES,
      items: questionEvidence,
      onChange: (items) => {
        mutatePillar(org.id, review.id, pillar.pillarKey, (p) => {
          const others = (p.evidence || []).filter((e) => e.questionId !== q.id);
          const tagged = items.map((entry) => ({
            ...entry,
            questionId: q.id,
          }));
          p.evidence = others.concat(tagged);
        });
        refresh();
      },
    });
    evidenceEditor.classList.add("question-evidence");

    // In observe mode, keep evidence available but slightly quieter via class
    if (phase === "observe") {
      evidenceEditor.classList.add("question-evidence--observe");
    }

    questionWrap.append(evLabel, evHint, evidenceEditor);

    // Guidance: quieter in observe mode (still available)
    if (phase === "discussion") {
      questionWrap.append(createQuestionGuidance(q));
    } else {
      const guideWrap = document.createElement("div");
      guideWrap.className = "question-guidance--observe";
      guideWrap.append(createQuestionGuidance(q));
      questionWrap.append(guideWrap);
    }

    container.append(questionWrap);
  });
}

function createFromPillarPanel(
  pillar,
  mode
) {
  const wrap =
    document.createElement(
      "div"
    );

  wrap.className =
    "from-pillar";

  const title =
    document.createElement(
      "p"
    );

  title.className =
    "from-pillar__title";

  title.textContent =
    "From this pillar";

  const subtitle =
    document.createElement(
      "p"
    );

  subtitle.className =
    "text-caption from-pillar__subtitle";

  if (
    mode === "strengths"
  ) {
    subtitle.textContent =
      "Investigation information to consider when identifying what is working well.";
  } else if (
    mode === "opportunities"
  ) {
    subtitle.textContent =
      "Investigation information to consider when identifying gaps or inconsistencies.";
  } else {
    subtitle.textContent =
      "The key information from this pillar to consider when forming your professional observation.";
  }

  wrap.append(
    title,
    subtitle
  );

  const questions =
    PILLAR_QUESTIONS[
      pillar.pillarKey
    ] || [];

  const responses =
    pillar.questionResponses ||
    {};

  const evidence =
    pillar.evidence || [];

  let any = false;

  questions.forEach(
    (q, index) => {
      const response =
        responses[q.id] ||
        {};

      const observed =
        (
          response.observed ||
          ""
        ).trim();

      const learned =
        (
          response.learned ||
          response.response ||
          ""
        ).trim();

      const qEvidence =
        evidence.filter(
          (e) =>
            e.questionId ===
            q.id
        );

      if (
        !observed &&
        !learned &&
        qEvidence.length ===
          0
      ) {
        return;
      }

      any = true;

      const block =
        document.createElement(
          "div"
        );

      block.className =
        "from-pillar__question";

      const qTitle =
        document.createElement(
          "p"
        );

      qTitle.className =
        "from-pillar__question-title";

      qTitle.textContent =
        `Q${index + 1}`;

      block.append(
        qTitle
      );

      if (observed) {
        const row =
          document.createElement(
            "div"
          );

        row.className =
          "from-pillar__row";

        const label =
          document.createElement(
            "span"
          );

        label.className =
          "from-pillar__label";

        label.textContent =
          "Observed";

        const text =
          document.createElement(
            "span"
          );

        text.className =
          "from-pillar__text";

        text.textContent =
          observed;

        row.append(
          label,
          text
        );

        block.append(
          row
        );
      }

      if (learned) {
        const row =
          document.createElement(
            "div"
          );

        row.className =
          "from-pillar__row";

        const label =
          document.createElement(
            "span"
          );

        label.className =
          "from-pillar__label";

        label.textContent =
          "Learned";

        const text =
          document.createElement(
            "span"
          );

        text.className =
          "from-pillar__text";

        text.textContent =
          learned;

        row.append(
          label,
          text
        );

        block.append(
          row
        );
      }

      qEvidence.forEach(
        (e) => {
          const content =
            (
              e.content ||
              ""
            ).trim();

          if (!content) {
            return;
          }

          const row =
            document.createElement(
              "div"
            );

          row.className =
            "from-pillar__row";

          const label =
            document.createElement(
              "span"
            );

          label.className =
            "from-pillar__label";

          label.textContent =
            e.sourceType ||
            "Evidence";

          const text =
            document.createElement(
              "span"
            );

          text.className =
            "from-pillar__text";

          text.textContent =
            content;

          row.append(
            label,
            text
          );

          block.append(
            row
          );
        }
      );

      wrap.append(
        block
      );
    }
  );

  const otherEvidence =
    evidence.filter(
      (e) => !e.questionId
    );

  if (
    otherEvidence.length >
    0
  ) {
    any = true;

    const block =
      document.createElement(
        "div"
      );

    block.className =
      "from-pillar__question";

    const qTitle =
      document.createElement(
        "p"
      );

    qTitle.className =
      "from-pillar__question-title";

    qTitle.textContent =
      "Other evidence";

    block.append(
      qTitle
    );

    otherEvidence.forEach(
      (e) => {
        const content =
          (
            e.content ||
            ""
          ).trim();

        if (!content) {
          return;
        }

        const row =
          document.createElement(
            "div"
          );

        row.className =
          "from-pillar__row";

        const label =
          document.createElement(
            "span"
          );

        label.className =
          "from-pillar__label";

        label.textContent =
          e.sourceType ||
          "Evidence";

        const text =
          document.createElement(
            "span"
          );

        text.className =
          "from-pillar__text";

        text.textContent =
          content;

        row.append(
          label,
          text
        );

        block.append(
          row
        );
      }
    );

    wrap.append(
      block
    );
  }

  if (!any) {
    const empty =
      document.createElement(
        "p"
      );

    empty.className =
      "text-caption from-pillar__empty";

    empty.textContent =
      "No investigation information has been captured on this pillar yet.";

    wrap.append(
      empty
    );
  }

  return wrap;
}

// ==========================================================================
// CONTEXTUAL JUDGEMENT FIELD
// ==========================================================================
//
// LOCKED BEHAVIOUR:
//
// Only ONE contextual "From this pillar" panel may be open at a time.
//
// When the input is focused:
//
//   From this pillar
//   Section title
//   Hint
//   Input
//
// The section heading NEVER moves above the contextual panel.
//
// Selecting another judgement field automatically closes any
// previously-open contextual panel.
//
// Clicking/tapping away closes the active contextual panel.
// ==========================================================================

function createJudgementSection({
  pillar,
  mode,
  label,
  hint,
  placeholder,
  value,
  onSave,
}) {
  const section =
    document.createElement(
      "div"
    );

  section.className =
    "judgement-section";

  // --------------------------------------------------------
  // CONTEXT PANEL
  // --------------------------------------------------------

  const sourcePanel =
    createFromPillarPanel(
      pillar,
      mode
    );

  sourcePanel.classList.add(
    "from-pillar--contextual"
  );

  sourcePanel.hidden =
    true;

  section.append(
    sourcePanel
  );

  // --------------------------------------------------------
  // SECTION TITLE
  // --------------------------------------------------------

  const heading =
    document.createElement(
      "p"
    );

  heading.className =
    "field__label judgement-section__label";

  heading.textContent =
    label;

  section.append(
    heading
  );

  // --------------------------------------------------------
  // HINT
  // --------------------------------------------------------

  if (hint) {
    const hintElement =
      document.createElement(
        "p"
      );

    hintElement.className =
      "text-caption judgement-section__hint";

    hintElement.textContent =
      hint;

    section.append(
      hintElement
    );
  }

  // --------------------------------------------------------
  // INPUT
  // --------------------------------------------------------

  const field =
    createFreeTextAreaField({
      placeholder,
      items: value || [],

      onChange: (items) => {
        onSave(items);
      },
    });

  field.classList.add(
    "judgement-section__field"
  );

  section.append(
    field
  );

  // --------------------------------------------------------
  // CONTEXTUAL VISIBILITY
  // --------------------------------------------------------
  //
  // IMPORTANT:
  // There must only ever be ONE contextual panel
  // visible inside the current assessment screen.
  //
  // We therefore close all other contextual panels
  // before opening this one.
  // --------------------------------------------------------

  const closeOtherContextPanels =
    () => {
      const currentForm =
        section.closest(
          ".screen"
        ) ||
        section.parentElement;

      if (!currentForm) {
        return;
      }

      const otherPanels =
        currentForm.querySelectorAll(
          ".from-pillar--contextual"
        );

      otherPanels.forEach(
        (panel) => {
          if (
            panel !==
            sourcePanel
          ) {
            panel.hidden =
              true;

            const owningSection =
              panel.closest(
                ".judgement-section"
              );

            if (
              owningSection
            ) {
              owningSection.classList.remove(
                "judgement-section--active"
              );
            }
          }
        }
      );
    };

  const showContext =
    () => {
      // Close every other contextual
      // panel BEFORE opening this one.
      closeOtherContextPanels();

      sourcePanel.hidden =
        false;

      section.classList.add(
        "judgement-section--active"
      );
    };

  const hideContext =
    () => {
      sourcePanel.hidden =
        true;

      section.classList.remove(
        "judgement-section--active"
      );
    };

  // --------------------------------------------------------
  // WRAPPER FOCUS EVENTS
  // --------------------------------------------------------

  if (field) {
    field.addEventListener?.(
      "focusin",
      showContext
    );

    field.addEventListener?.(
      "focusout",
      (event) => {
        const next =
          event.relatedTarget;

        if (
          next &&
          section.contains(
            next
          )
        ) {
          return;
        }

        hideContext();
      }
    );
  }

  // --------------------------------------------------------
  // ACTUAL EDITABLE ELEMENTS
  // --------------------------------------------------------
  //
  // createFreeTextAreaField may return a wrapper
  // rather than the native textarea/input.
  //
  // Listen directly to every editable element as
  // well so the behaviour remains reliable on
  // iPhone/iPad and desktop.
  // --------------------------------------------------------

  const editableElements =
    section.querySelectorAll(
      "textarea, input, [contenteditable='true']"
    );

  editableElements.forEach(
    (element) => {
      element.addEventListener(
        "focus",
        showContext
      );

      element.addEventListener(
        "blur",
        (event) => {
          const next =
            event.relatedTarget;

          if (
            next &&
            section.contains(
              next
            )
          ) {
            return;
          }

          hideContext();
        }
      );

      element.addEventListener(
        "pointerdown",
        showContext
      );

      element.addEventListener(
        "click",
        showContext
      );
    }
  );

  return section;
}


/**
 * Package B: suggested confidence from coverage + evidence + source diversity.
 * Does not write assessorConfidence. Transparent profile for the UI.
 * @param {object} pillar
 * @returns {{ level: 'Low'|'Medium'|'High', profile: object, warnings: string[] }}
 */
function suggestAssessorConfidence(pillar) {
  const questions = PILLAR_QUESTIONS[pillar.pillarKey] || [];
  const questionCount = questions.length;
  const responses = pillar.questionResponses || {};
  const evidence = pillar.evidence || [];

  let questionsInvestigated = 0;
  questions.forEach((q) => {
    const r = responses[q.id] || {};
    const observed = (r.observed || "").trim();
    const learned = (r.learned || r.response || "").trim();
    if (observed || learned) questionsInvestigated += 1;
  });

  // Unauthored pillars: treat pillar-level notes lightly via evidence only
  if (questionCount === 0) {
    questionsInvestigated = 0;
  }

  const questionsWithEvidence = new Set(
    evidence.map((e) => e.questionId).filter(Boolean)
  ).size;

  // Orphan / pillar-level evidence still counts as "some evidence"
  const evidenceCount = evidence.length;
  const sourceTypes = [
    ...new Set(evidence.map((e) => e.sourceType).filter(Boolean)),
  ];
  const sourceCount = sourceTypes.length;

  const profile = {
    questionCount,
    questionsInvestigated,
    questionsWithEvidence,
    evidenceCount,
    sourceTypes,
    sourceCount,
  };

  // --- Simple transparent rules (not quantity alone) ---
  let level = "Low";

  if (questionCount === 0) {
    // No question architecture: base on evidence breadth only
    if (evidenceCount === 0) level = "Low";
    else if (evidenceCount >= 2 && sourceCount >= 2) level = "High";
    else if (evidenceCount >= 1) level = "Medium";
    else level = "Low";
  } else {
    const narrowEvidence =
      evidenceCount > 0 && questionsWithEvidence <= 1 && sourceCount <= 1;
    const strong =
      questionsWithEvidence >= 3 &&
      sourceCount >= 2 &&
      questionsInvestigated >= Math.min(4, questionCount);
    const moderate =
      (questionsWithEvidence >= 2 && sourceCount >= 1) ||
      (questionsInvestigated >= 3 && evidenceCount >= 1) ||
      (evidenceCount >= 2 && questionsWithEvidence >= 2);

    if (evidenceCount === 0 && questionsInvestigated === 0) {
      level = "Low";
    } else if (evidenceCount === 0 && questionsInvestigated > 0) {
      // Notes without formal evidence: still limited support
      level = questionsInvestigated >= 4 ? "Medium" : "Low";
    } else if (narrowEvidence && questionsInvestigated <= 2) {
      level = "Low";
    } else if (strong) {
      level = "High";
    } else if (moderate) {
      level = "Medium";
    } else {
      level = "Low";
    }
  }

  const warnings = [];
  const chosen = pillar.assessorConfidence?.level;
  const score = pillar.maturityScore;

  if (chosen === "High" && (level === "Low" || (evidenceCount <= 1 && questionsWithEvidence <= 1))) {
    warnings.push(
      "High confidence with limited evidence. Review before completing."
    );
  }
  if (score === 4 && (level === "Low" || evidenceCount === 0 || questionsWithEvidence <= 1)) {
    warnings.push(
      "Score 4 with limited supporting evidence. Make sure the judgement is based on observed evidence, not assumption."
    );
  }
  if (score === 1 && evidenceCount === 0 && questionsInvestigated <= 1) {
    warnings.push(
      "Low maturity score with little on file. Confirm this reflects what you found, not a gap in capture."
    );
  }

  return { level, profile, warnings };
}

function formatConfidenceProfile(profile) {
  if (profile.questionCount === 0) {
    const src =
      profile.sourceCount > 0
        ? `${profile.sourceCount} evidence source${profile.sourceCount === 1 ? "" : "s"}`
        : "no formal evidence sources yet";
    return `${profile.evidenceCount} evidence item${profile.evidenceCount === 1 ? "" : "s"} · ${src}`;
  }
  return (
    `${profile.questionsInvestigated}/${profile.questionCount} questions investigated · ` +
    `${profile.questionsWithEvidence}/${profile.questionCount} have formal evidence · ` +
    `${profile.sourceCount} evidence source${profile.sourceCount === 1 ? "" : "s"}`
  );
}


// ==========================================================================
// HEALTH REVIEW LAYER
// ==========================================================================

function renderHealthReviewLayer(
  container,
  pillar,
  review,
  org,
  refresh
) {
  const guidance =
    PILLAR_GUIDANCE[
      pillar.pillarKey
    ];

  // --------------------------------------------------------
  // INVESTIGATION
  // --------------------------------------------------------

  renderMethodologyQuestions(
    container,
    pillar,
    review,
    org,
    refresh
  );

  // --------------------------------------------------------
  // YOUR JUDGEMENT
  // --------------------------------------------------------

  const pillarAssessmentHeading =
    document.createElement(
      "h2"
    );

  pillarAssessmentHeading.className =
    "text-heading-section";

  pillarAssessmentHeading.textContent =
    "Your judgement";

  container.append(
    pillarAssessmentHeading
  );

  // --------------------------------------------------------
  // STRENGTHS
  // --------------------------------------------------------

  const strengthsSection =
    createJudgementSection({
      pillar,
      mode: "strengths",

      label:
        "Strengths",

      hint:
        "What is working well? Write your professional judgement. One point per line.",

      placeholder:
        "What is working well?",

      value:
        pillar.strengths,

      onSave: (items) => {
        mutatePillar(
          org.id,
          review.id,
          pillar.pillarKey,
          (p) => {
            p.strengths =
              items;
          }
        );
      },
    });

  container.append(
    strengthsSection
  );

  // --------------------------------------------------------
  // OPPORTUNITIES
  // --------------------------------------------------------

  const opportunitiesSection =
    createJudgementSection({
      pillar,
      mode: "opportunities",

      label:
        "Opportunities",

      hint:
        "Name the gap or inconsistency, not the fix. One point per line.",

      placeholder:
        "Where could operational maturity improve?",

      value:
        pillar.opportunities,

      onSave: (items) => {
        mutatePillar(
          org.id,
          review.id,
          pillar.pillarKey,
          (p) => {
            p.opportunities =
              items;
          }
        );
      },
    });

  container.append(
    opportunitiesSection
  );

  const opportunitiesGuidance =
    createGuidancePanel(
      guidance.opportunities
    );

  container.append(
    opportunitiesGuidance
  );

  // --------------------------------------------------------
  // PROFESSIONAL OBSERVATION
  // --------------------------------------------------------

  const professionalSection =
    document.createElement(
      "div"
    );

  professionalSection.className =
    "judgement-section";

  // --------------------------------------------------------
  // FROM THIS PILLAR
  // --------------------------------------------------------

  const professionalSource =
    createFromPillarPanel(
      pillar,
      "professionalObservation"
    );

  professionalSource.classList.add(
    "from-pillar--contextual"
  );

  professionalSource.hidden =
    true;

  professionalSection.append(
    professionalSource
  );

  // --------------------------------------------------------
  // PROFESSIONAL OBSERVATION TITLE
  // --------------------------------------------------------

  const professionalLabel =
    document.createElement(
      "p"
    );

  professionalLabel.className =
    "field__label judgement-section__label";

  professionalLabel.textContent =
    "Professional observation (client-visible)";

  professionalSection.append(
    professionalLabel
  );

  // --------------------------------------------------------
  // ASSESSOR'S STRENGTHS / OPPORTUNITIES
  // --------------------------------------------------------

  const judgementSummary =
    document.createElement(
      "div"
    );

  judgementSummary.className =
    "from-pillar__judgement-summary";

  let hasJudgement =
    false;

  if (
    pillar.strengths?.length
  ) {
    hasJudgement =
      true;

    const heading =
      document.createElement(
        "p"
      );

    heading.className =
      "from-pillar__question-title";

    heading.textContent =
      "Your strengths";

    judgementSummary.append(
      heading
    );

    pillar.strengths.forEach(
      (item) => {
        const row =
          document.createElement(
            "p"
          );

        row.className =
          "from-pillar__judgement-item";

        row.textContent =
          "• " + item;

        judgementSummary.append(
          row
        );
      }
    );
  }

  if (
    pillar.opportunities?.length
  ) {
    hasJudgement =
      true;

    const heading =
      document.createElement(
        "p"
      );

    heading.className =
      "from-pillar__question-title";

    heading.textContent =
      "Your opportunities";

    judgementSummary.append(
      heading
    );

    pillar.opportunities.forEach(
      (item) => {
        const row =
          document.createElement(
            "p"
          );

        row.className =
          "from-pillar__judgement-item";

        row.textContent =
          "• " + item;

        judgementSummary.append(
          row
        );
      }
    );
  }

  if (hasJudgement) {
    professionalSource.append(
      judgementSummary
    );
  }

  // --------------------------------------------------------
  // PROFESSIONAL HINT
  // --------------------------------------------------------

  const professionalHint =
    document.createElement(
      "p"
    );

  professionalHint.className =
    "text-caption judgement-section__hint";

  professionalHint.textContent =
    "This appears in the client report. Bring the findings together into a clear, balanced professional observation.";

  professionalSection.append(
    professionalHint
  );

  // --------------------------------------------------------
  // PROFESSIONAL INPUT
  // --------------------------------------------------------

  const profObs =
    createTextField({
      id:
        "professionalObservation",

      label: "",

      textarea: true,
    });

  profObs.input.value =
    pillar.professionalObservation ||
    "";

  profObs.input.placeholder =
    "Clear, balanced summary for the client. Factual and professional.";

  const profLabel =
    profObs.element.querySelector(
      ".field__label"
    );

  if (profLabel) {
    profLabel.style.display =
      "none";
  }

  profObs.element.classList.add(
    "judgement-section__field"
  );

  professionalSection.append(
    profObs.element
  );

  // --------------------------------------------------------
  // PROFESSIONAL CONTEXT VISIBILITY
  // --------------------------------------------------------

  const closeOtherProfessionalPanels =
    () => {
      const currentScreen =
        professionalSection.closest(
          ".screen"
        ) ||
        professionalSection.parentElement;

      if (!currentScreen) {
        return;
      }

      const otherPanels =
        currentScreen.querySelectorAll(
          ".from-pillar--contextual"
        );

      otherPanels.forEach(
        (panel) => {
          if (
            panel !==
            professionalSource
          ) {
            panel.hidden =
              true;

            const owningSection =
              panel.closest(
                ".judgement-section"
              );

            if (
              owningSection
            ) {
              owningSection.classList.remove(
                "judgement-section--active"
              );
            }
          }
        }
      );
    };

  const showProfessionalContext =
    () => {
      // Close every other contextual
      // panel before opening this one.
      closeOtherProfessionalPanels();

      professionalSource.hidden =
        false;

      professionalSection.classList.add(
        "judgement-section--active"
      );
    };

  const hideProfessionalContext =
    () => {
      professionalSource.hidden =
        true;

      professionalSection.classList.remove(
        "judgement-section--active"
      );
    };

  profObs.input.addEventListener(
    "focus",
    showProfessionalContext
  );

  profObs.input.addEventListener(
    "pointerdown",
    showProfessionalContext
  );

  profObs.input.addEventListener(
    "click",
    showProfessionalContext
  );

  profObs.input.addEventListener(
    "blur",
    (event) => {
      const next =
        event.relatedTarget;

      if (
        next &&
        professionalSection.contains(
          next
        )
      ) {
        return;
      }

      hideProfessionalContext();

      mutatePillar(
        org.id,
        review.id,
        pillar.pillarKey,
        (p) => {
          p.professionalObservation =
            profObs.input.value;
        }
      );
    }
  );

  container.append(
    professionalSection
  );

  container.append(
    createGuidancePanel(
      guidance.professionalObservation
    )
  );

  // --------------------------------------------------------
  // INTERNAL NOTES
  // --------------------------------------------------------

  const internalNotes =
    createTextField({
      id:
        "internalAssessorNotes",

      label:
        "Internal assessor notes (never client-visible)",

      textarea: true,
    });

  internalNotes.element.classList.add(
    "field--internal"
  );

  internalNotes.input.value =
    pillar.internalAssessorNotes ||
    "";

  internalNotes.input.addEventListener(
    "blur",
    () => {
      mutatePillar(
        org.id,
        review.id,
        pillar.pillarKey,
        (p) => {
          p.internalAssessorNotes =
            internalNotes.input.value;
        }
      );
    }
  );

  container.append(
    internalNotes.element
  );

  // --------------------------------------------------------
  // EARLIER UNLINKED EVIDENCE
  // --------------------------------------------------------

  const authoredQuestions =
    (
      PILLAR_QUESTIONS[
        pillar.pillarKey
      ] || []
    ).length > 0;

  const orphanEvidence =
    (
      pillar.evidence || []
    ).filter(
      (e) => !e.questionId
    );

  if (
    authoredQuestions &&
    orphanEvidence.length >
      0
  ) {
    const orphanLabel =
      document.createElement(
        "p"
      );

    orphanLabel.className =
      "field__label";

    orphanLabel.textContent =
      "Earlier evidence (not linked to a question)";

    const orphanHint =
      document.createElement(
        "p"
      );

    orphanHint.className =
      "text-caption";

    orphanHint.textContent =
      "Captured before evidence was recorded against each question. Still counts toward this pillar.";

    const orphanEditor =
      createEvidenceListEditor({
        sourceTypes:
          EVIDENCE_SOURCE_TYPES,

        items:
          orphanEvidence,

        onChange:
          (items) => {
            mutatePillar(
              org.id,
              review.id,
              pillar.pillarKey,
              (p) => {
                const linked =
                  (
                    p.evidence ||
                    []
                  ).filter(
                    (e) =>
                      e.questionId
                  );

                p.evidence =
                  linked.concat(
                    items.map(
                      (entry) => {
                        const {
                          questionId,
                          ...rest
                        } =
                          entry;

                        return rest;
                      }
                    )
                  );
              }
            );

            refresh();
          },
      });

    container.append(
      orphanLabel,
      orphanHint,
      orphanEditor
    );
  }

  // --------------------------------------------------------
  // EVIDENCE FOR PILLARS WITHOUT QUESTIONS
  // --------------------------------------------------------

  if (
    !authoredQuestions
  ) {
    const evidenceLabel =
      document.createElement(
        "p"
      );

    evidenceLabel.className =
      "field__label";

    evidenceLabel.textContent =
      "Evidence";

    const evidenceHint =
      document.createElement(
        "p"
      );

    evidenceHint.className =
      "text-caption";

    evidenceHint.textContent =
      "No assessment questions for this pillar yet. Capture at least one evidence item here before marking complete.";

    const evidenceEditor =
      createEvidenceListEditor({
        sourceTypes:
          EVIDENCE_SOURCE_TYPES,

        items:
          pillar.evidence ||
          [],

        onChange:
          (items) => {
            mutatePillar(
              org.id,
              review.id,
              pillar.pillarKey,
              (p) => {
                p.evidence =
                  items;
              }
            );

            refresh();
          },
      });

    container.append(
      evidenceLabel,
      evidenceHint,
      evidenceEditor
    );
  }

  // --------------------------------------------------------
  // SCORE
  // --------------------------------------------------------

  const scoreLabel =
    document.createElement(
      "p"
    );

  scoreLabel.className =
    "field__label";

  scoreLabel.textContent =
    "Maturity score";

  const scoreSelector =
    createScoreSelector({
      value:
        pillar.maturityScore,

      onChange:
        (score) => {
          const previousScore =
            pillar.maturityScore;

          function commit(
            reason
          ) {
            mutatePillar(
              org.id,
              review.id,
              pillar.pillarKey,
              (p) => {
                p.maturityScore =
                  score;

                p.scoreHistory.push({
                  score,

                  setAt:
                    new Date().toISOString(),

                  reason:
                    reason ||
                    (
                      previousScore ==
                      null
                    )
                      ? "Initial score"
                      : "",
                });
              }
            );

            refresh();
          }

          if (
            previousScore !=
              null &&
            previousScore !==
              score
          ) {
            askReason({
              title:
                "Score revision",

              message:
                `Changing from ${previousScore} to ${score}. A short note helps if you revisit this later.`,

              confirmLabel:
                "Save score",

              onConfirm:
                commit,
            });

            return;
          }

          commit("");
        },
    });

  container.append(
    scoreLabel,
    scoreSelector,

    createGuidancePanel(
      guidance.maturityScore
    )
  );

  // --------------------------------------------------------
  // CONFIDENCE (Package B: suggestion + human choice)
  // --------------------------------------------------------

  const confidenceSuggestion = suggestAssessorConfidence(pillar);

  const confidenceLabel = document.createElement("p");
  confidenceLabel.className = "field__label";
  confidenceLabel.textContent = "Assessor confidence (internal only)";

  const suggestionBox = document.createElement("div");
  suggestionBox.className = "confidence-suggestion";

  const suggestionLine = document.createElement("p");
  suggestionLine.className = "confidence-suggestion__line";
  suggestionLine.innerHTML =
    `<span class="confidence-suggestion__label">Suggested:</span> ` +
    `<strong>${confidenceSuggestion.level}</strong>`;

  const profileLine = document.createElement("p");
  profileLine.className = "text-caption confidence-suggestion__profile";
  profileLine.textContent = formatConfidenceProfile(confidenceSuggestion.profile);

  suggestionBox.append(suggestionLine, profileLine);

  confidenceSuggestion.warnings.forEach((msg) => {
    const warn = document.createElement("p");
    warn.className = "confidence-suggestion__warning";
    warn.textContent = msg;
    suggestionBox.append(warn);
  });

  const confidenceRow = document.createElement("div");
  confidenceRow.className = "confidence-row";

  CONFIDENCE_LEVELS.forEach((level) => {
    const selected = pillar.assessorConfidence?.level === level;
    const btn = createButton({
      label: level,
      variant: selected ? "primary" : "secondary",
      onClick: () => {
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

    if (selected) {
      btn.classList.add("confidence-row__selected");
    }

    // Quiet hint when button matches suggestion and nothing chosen yet
    if (!pillar.assessorConfidence?.level && level === confidenceSuggestion.level) {
      btn.classList.add("confidence-row__suggested");
    }

    confidenceRow.append(btn);
  });

  container.append(
    confidenceLabel,
    suggestionBox,
    confidenceRow,
    createGuidancePanel(guidance.assessorConfidence)
  );

}



// ==========================================================================
// DIAGNOSTIC LAYER (Paid methodology v5.1)
// Reference from Free only - never auto-fills client Diagnostic fields.
// Prompts and examples guide the assessor; judgement stays human.
// ==========================================================================

function diagnosticFieldGuide(title, body) {
  const wrap = document.createElement("div");
  wrap.className = "diag-guide";
  const t = document.createElement("p");
  t.className = "text-caption";
  t.style.fontWeight = "600";
  t.textContent = title;
  const b = document.createElement("p");
  b.className = "text-caption";
  b.textContent = body;
  wrap.append(t, b);
  return wrap;
}

function renderHealthReviewReference(container, pillar) {
  const box = document.createElement("div");
  box.className = "card";
  box.style.background = "var(--color-surface, #F3F1EC)";

  const title = document.createElement("p");
  title.className = "card__title";
  title.textContent = "From the Health Review (read only)";

  const hint = document.createElement("p");
  hint.className = "text-caption";
  hint.textContent =
    "Use this as your map. Do not copy it straight into the Diagnostic. Rewrite in paid language: evidence, consequence, cause, action.";

  box.append(title, hint);

  const score = pillar.maturityScore;
  const conf = pillar.assessorConfidence;
  const meta = document.createElement("p");
  meta.className = "text-caption";
  meta.textContent =
    "Score: " +
    (score != null ? String(score) : "not set") +
    " · Confidence: " +
    (conf || "not set");
  box.append(meta);

  function listBlock(label, items) {
    if (!items || !items.length) return;
    const h = document.createElement("p");
    h.className = "text-caption";
    h.style.fontWeight = "600";
    h.textContent = label;
    box.append(h);
    const ul = document.createElement("ul");
    items.forEach((item) => {
      const text =
        typeof item === "string"
          ? item
          : item.text || item.note || item.description || "";
      if (!String(text).trim()) return;
      const li = document.createElement("li");
      li.className = "text-caption";
      li.textContent = text;
      ul.append(li);
    });
    if (ul.childNodes.length) box.append(ul);
  }

  listBlock("Strengths", pillar.strengths);
  listBlock("Opportunities", pillar.opportunities);

  if ((pillar.professionalObservation || "").trim()) {
    const h = document.createElement("p");
    h.className = "text-caption";
    h.style.fontWeight = "600";
    h.textContent = "Professional observation";
    const p = document.createElement("p");
    p.className = "text-caption";
    p.textContent = pillar.professionalObservation;
    box.append(h, p);
  }

  // Evidence / question notes if present
  const evidenceBits = [];
  if (Array.isArray(pillar.evidence)) {
    pillar.evidence.forEach((ev) => {
      const t = ev.note || ev.text || ev.summary || "";
      if (String(t).trim()) evidenceBits.push(t);
    });
  }
  if (Array.isArray(pillar.questionResponses)) {
    pillar.questionResponses.forEach((qr) => {
      if ((qr.observedNote || "").trim())
        evidenceBits.push("Observed: " + qr.observedNote);
      if ((qr.learnedNote || "").trim())
        evidenceBits.push("Learned: " + qr.learnedNote);
    });
  }
  // schema may store responses differently
  if (pillar.responses && typeof pillar.responses === "object") {
    Object.values(pillar.responses).forEach((qr) => {
      if (!qr || typeof qr !== "object") return;
      if ((qr.observedNote || qr.whatIObserved || "").trim())
        evidenceBits.push(
          "Observed: " + (qr.observedNote || qr.whatIObserved)
        );
      if ((qr.learnedNote || qr.whatILearned || "").trim())
        evidenceBits.push(
          "Learned: " + (qr.learnedNote || qr.whatILearned)
        );
    });
  }
  if (evidenceBits.length) {
    listBlock(
      "Evidence / notes (sample)",
      evidenceBits.slice(0, 8).map((t) => t)
    );
  }

  const none =
    !pillar.strengths?.length &&
    !pillar.opportunities?.length &&
    !(pillar.professionalObservation || "").trim() &&
    !evidenceBits.length;
  if (none) {
    const p = document.createElement("p");
    p.className = "text-caption";
    p.textContent =
      "No Free content on this pillar yet. Complete or consult the Health Review before deep Diagnostic work if you can.";
    box.append(p);
  }

  container.append(box);
}

function renderDiagnosticLayer(
  container,
  pillarKey,
  cycleEntry,
  review,
  org,
  cycleId,
  refresh
) {
  const entry = normalizeCyclePillarEntry(cycleEntry);
  const pillar =
    review.pillarAssessments.find((p) => p.pillarKey === pillarKey) || {};

  const divider = document.createElement("hr");
  divider.className = "section-divider";

  const heading = document.createElement("h2");
  heading.className = "text-heading-section";
  heading.textContent = "Operational Diagnostic (paid)";

  const intro = document.createElement("p");
  intro.className = "text-caption";
  intro.textContent =
    "Paid depth for this pillar only. Free content above is for reference. You write the Diagnostic. No auto-fill into the client report.";

  container.append(divider, heading, intro);

  renderHealthReviewReference(container, pillar);

  function save(patch) {
    mutateCyclePillar(org.id, review.id, cycleId, pillarKey, (e) => {
      Object.assign(e, patch);
    });
  }

  function fieldBlock(id, label, value, key, placeholder, guideTitle, guideBody) {
    const wrap = document.createElement("div");
    wrap.className = "stack-tight";
    wrap.append(diagnosticFieldGuide(guideTitle, guideBody));
    const f = createTextField({ id, label, textarea: true });
    f.input.value = value || "";
    if (placeholder) f.input.placeholder = placeholder;
    f.input.addEventListener("blur", () => {
      save({ [key]: f.input.value });
    });
    wrap.append(f.element);
    return wrap;
  }

  container.append(
    fieldBlock(
      "diag-findings",
      "What we found",
      entry.findings,
      "findings",
      "e.g. Three of eight core lines wrong on the shelf vs system. Dead stock blocking two pallet locations.",
      "Prompt",
      "Write specific evidence: what you saw, checked, or were told with an example. Prefer A/B/C short points. Avoid vague lines like culture needs improvement."
    )
  );

  container.append(
    fieldBlock(
      "diag-why",
      "Why it matters",
      entry.whyItMatters,
      "whyItMatters",
      "e.g. Customers learn stock cannot be trusted. Staff time is burned hunting product. Cash sits in slow lines.",
      "Prompt",
      "State the effect on the business: customers, time, margin, risk, or reliance on a few people. This is consequence, not the fix."
    )
  );

  container.append(
    fieldBlock(
      "diag-root",
      "Root cause",
      entry.rootCauseAnalysis,
      "rootCauseAnalysis",
      "e.g. Stock truth is not owned. Adjustments are informal. Dead stock is not actively cleared.",
      "Prompt",
      "One main cause. Not a long list. Not personal blame without evidence. Ask: why does this keep happening?"
    )
  );

  container.append(
    fieldBlock(
      "diag-risk",
      "Operational risk (optional)",
      entry.operationalRisk,
      "operationalRisk",
      "e.g. Risk grows when the experienced warehouse person is off.",
      "Prompt",
      "Optional. Extra risk detail if needed. Keep short."
    )
  );

  container.append(
    fieldBlock(
      "diag-cost",
      "Cost of inaction (optional)",
      entry.costOfInaction,
      "costOfInaction",
      "Only if evidence supports it. Otherwise leave blank.",
      "Prompt",
      "Optional. Money or clear operational cost only when you can support it. Do not invent a pound figure."
    )
  );

  // Recommendations
  const recWrap = document.createElement("div");
  recWrap.className = "stack-tight";
  recWrap.append(
    diagnosticFieldGuide(
      "Prompt",
      "Few practical changes. Client-visible. Example: Name one person for core-line accuracy. Daily check of 10 lines for two weeks."
    )
  );
  const recLabel = document.createElement("p");
  recLabel.className = "field__label";
  recLabel.textContent = "Recommendations (what should change)";
  recWrap.append(recLabel);
  recWrap.append(
    createTextListEditor({
      placeholder: "e.g. Name one person accountable for core-line accuracy",
      items: entry.recommendations.map((r) => r.text),
      onChange: (texts) => {
        mutateCyclePillar(org.id, review.id, cycleId, pillarKey, (e) => {
          e.recommendations = texts.map((text, i) => ({
            id: e.recommendations[i]?.id || `rec_${Date.now().toString(36)}_${i}`,
            text,
            businessImpact: [],
          }));
        });
      },
    })
  );
  container.append(recWrap);

  // Do not do
  const doWrap = document.createElement("div");
  doWrap.className = "stack-tight";
  doWrap.append(
    diagnosticFieldGuide(
      "Prompt",
      "Stop the wrong fix. Example: Do not buy a new stock system before ownership and daily checks exist. Do not run a full stocktake as the first move."
    )
  );
  const doLabel = document.createElement("p");
  doLabel.className = "field__label";
  doLabel.textContent = "Do not do";
  doWrap.append(doLabel);
  doWrap.append(
    createTextListEditor({
      placeholder: "e.g. Do not run a full stocktake as the first move",
      items: (entry.doNotDo || []).map((r) => r.text || r),
      onChange: (texts) => {
        mutateCyclePillar(org.id, review.id, cycleId, pillarKey, (e) => {
          e.doNotDo = texts.map((text, i) => ({
            id: e.doNotDo?.[i]?.id || `donot_${Date.now().toString(36)}_${i}`,
            text,
          }));
        });
      },
    })
  );
  container.append(doWrap);

  // How to start
  const planWrap = document.createElement("div");
  planWrap.className = "stack-tight";
  planWrap.append(
    diagnosticFieldGuide(
      "Prompt",
      "Who does what in the next 1-2 weeks. Example: Owner decides write-downs this week. Warehouse lead runs daily 10-line check. Manager reviews the miss log every Friday."
    )
  );
  const planLabel = document.createElement("p");
  planLabel.className = "field__label";
  planLabel.textContent = "How to start (implementation outline)";
  planWrap.append(planLabel);
  planWrap.append(
    createTextListEditor({
      placeholder:
        "e.g. Owner sets bands this week; manager reviews overrides on Friday",
      items: entry.implementationPlan.map((s) => s.step),
      onChange: (steps) => {
        mutateCyclePillar(org.id, review.id, cycleId, pillarKey, (e) => {
          e.implementationPlan = steps.map((step, i) => ({
            id: e.implementationPlan[i]?.id || `plan_${Date.now().toString(36)}_${i}`,
            step,
            timeframe: e.implementationPlan[i]?.timeframe || "",
          }));
        });
      },
    })
  );
  container.append(planWrap);

  const qa = document.createElement("p");
  qa.className = "text-caption";
  const ready = canCompleteDiagnosticPillar(entry);
  qa.textContent = ready
    ? "Minimum content for this pillar is present. You can mark complete."
    : "Before mark complete: findings, why it matters, root cause, at least one recommendation, and at least one how-to-start step.";
  container.append(qa);
}


// ==========================================================================
// MAIN RENDER
// ==========================================================================

export function renderPillarAssessment(
  container,
  params
) {
  const state =
    getState();

  const {
    org,
    review,
    pillar,
  } =
    findPillar(
      state,
      params.organisationId,
      params.reviewId,
      params.pillarKey
    );

  const screen =
    document.createElement(
      "div"
    );

  screen.className =
    "screen stack";

  if (
    !org ||
    !review ||
    !pillar
  ) {
    const notFound =
      document.createElement(
        "p"
      );

    notFound.className =
      "text-body-secondary";

    notFound.textContent =
      "Pillar assessment not found.";

    screen.append(
      notFound
    );

    container.append(
      screen
    );

    return;
  }

  const isDiagnosticMode =
    Boolean(
      params.cycleId
    );

  const cycle =
    isDiagnosticMode
      ? findCycle(
          review,
          params.cycleId
        )
      : null;

  if (
    isDiagnosticMode &&
    !cycle
  ) {
    const notFound =
      document.createElement(
        "p"
      );

    notFound.className =
      "text-body-secondary";

    notFound.textContent =
      "Diagnostic cycle not found.";

    screen.append(
      notFound
    );

    container.append(
      screen
    );

    return;
  }

  const cycleEntry =
    isDiagnosticMode
      ? cycle.pillars[
          pillar.pillarKey
        ]
      : null;

  if (
    isDiagnosticMode &&
    !cycleEntry
  ) {
    const notFound =
      document.createElement(
        "p"
      );

    notFound.className =
      "text-body-secondary";

    notFound.textContent =
      "This pillar is not selected for this Diagnostic cycle.";

    screen.append(
      notFound
    );

    container.append(
      screen
    );

    return;
  }

  const pillarMeta =
    PILLARS.find(
      (p) =>
        p.key ===
        pillar.pillarKey
    );

  const heading =
    document.createElement(
      "h1"
    );

  heading.className =
    "text-heading-screen";

  heading.textContent =
    pillarMeta.name;

  screen.append(
    heading,
    renderSummaryStrip(
      pillar,
      isDiagnosticMode,
      cycle
    )
  );

  const diagnosticLocked =
    isDiagnosticMode &&
    cycle.locked;

  const form =
    document.createElement(
      "div"
    );

  form.className =
    "stack";

  function refresh() {
    container.innerHTML =
      "";

    renderPillarAssessment(
      container,
      params
    );
  }

  if (
    isDiagnosticMode
  ) {
    if (
      diagnosticLocked
    ) {
      const lockedNotice =
        document.createElement(
          "p"
        );

      lockedNotice.className =
        "text-body-secondary";

      lockedNotice.textContent =
        `Diagnostic Cycle ${cycle.cycleNumber} is complete and locked. This cycle's findings are a permanent historical record.`;

      form.append(
        lockedNotice
      );
    } else {
      renderDiagnosticLayer(
        form,
        pillar.pillarKey,
        cycleEntry,
        review,
        org,
        cycle.id,
        refresh
      );
    }
  } else {
    renderHealthReviewLayer(
      form,
      pillar,
      review,
      org,
      refresh
    );
  }

  screen.append(
    form
  );

  if (
    isDiagnosticMode &&
    !diagnosticLocked
  ) {
    if (
      cycleEntry.status ===
      "selected-not-started"
    ) {
      mutateCyclePillar(
        org.id,
        review.id,
        cycle.id,
        pillar.pillarKey,
        (e) => {
          e.status =
            "in-progress";
        }
      );
    }
  } else if (
    !isDiagnosticMode &&
    pillar.healthReviewStatus ===
      "not-started"
  ) {
    mutatePillar(
      org.id,
      review.id,
      pillar.pillarKey,
      (p) => {
        p.healthReviewStatus =
          "in-progress";
      }
    );
  }

  // --------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------

  const actions =
    document.createElement(
      "div"
    );

  actions.className =
    "screen-actions stack-tight";

  if (
    !diagnosticLocked
  ) {
    if (
      isDiagnosticMode
    ) {
      const currentStatus =
        cycleEntry.status;

      const completeBtn =
        createButton({
          label:
            currentStatus ===
            "complete"
              ? "Marked complete"
              : "Mark pillar complete",

          variant:
            "primary",

          onClick:
            () => {
              const latest =
                normalizeCyclePillarEntry(
                  cycle.pillars[
                    pillar.pillarKey
                  ]
                );
              if (
                !canCompleteDiagnosticPillar(
                  latest
                )
              ) {
                window.alert(
                  "Paid Diagnostic needs: what we found, why it matters, root cause, at least one recommendation, and at least one how-to-start step."
                );
                return;
              }
              mutateCyclePillar(
                org.id,
                review.id,
                cycle.id,
                pillar.pillarKey,
                (e) => {
                  e.status =
                    "complete";
                }
              );

              back();
            },
        });

      actions.append(
        completeBtn
      );
    } else {
      const currentStatus =
        pillar.healthReviewStatus;

      const canComplete =
        pillar.evidence.length >
          0 &&
        pillar.maturityScore !=
          null;

      const completeBtn =
        createButton({
          label:
            currentStatus ===
            "complete"
              ? "Marked complete"
              : "Mark pillar complete",

          variant:
            "primary",

          onClick:
            () => {
              if (
                !canComplete
              ) {
                window.alert(
                  "Add at least one piece of evidence on this pillar (under any question) and a maturity score before marking complete."
                );

                return;
              }

              mutatePillar(
                org.id,
                review.id,
                pillar.pillarKey,
                (p) => {
                  p.healthReviewStatus =
                    "complete";
                }
              );

              back();
            },
        });

      actions.append(
        completeBtn
      );
    }
  }

  actions.append(
    createButton({
      label:
        "Back",

      variant:
        "secondary",

      onClick:
        () => back(),
    })
  );

  screen.append(
    actions
  );

  container.append(
    screen
  );
}
