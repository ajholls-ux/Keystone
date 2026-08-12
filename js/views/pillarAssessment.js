// ==========================================================================
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
import {
  createTextListEditor,
  createEvidenceListEditor,
  createFreeTextAreaField,
} from "../components/listEditor.js";
import { createGuidancePanel } from "../components/guidancePanel.js";
import { createQuestionGuidance } from "../components/questionGuidance.js";
import { back } from "../router.js";

function findPillar(state, organisationId, reviewId, pillarKey) {
  const org = state.organisations.find((o) => o.id === organisationId);
  const review = org?.reviews.find((r) => r.id === reviewId);
  const pillar = review?.pillarAssessments.find(
    (p) => p.pillarKey === pillarKey
  );

  return { org, review, pillar };
}

function findCycle(review, cycleId) {
  return review?.diagnosticCycles.find((c) => c.id === cycleId) || null;
}

function mutatePillar(
  organisationId,
  reviewId,
  pillarKey,
  mutator
) {
  updateState((state) => {
    const { review, pillar } = findPillar(
      state,
      organisationId,
      reviewId,
      pillarKey
    );

    if (!pillar) return state;

    mutator(pillar, review);
    review.lastUpdatedAt = new Date().toISOString();

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
    const { review } = findPillar(
      state,
      organisationId,
      reviewId,
      pillarKey
    );

    const cycle = findCycle(review, cycleId);
    const entry = cycle?.pillars[pillarKey];

    if (!entry) return state;

    mutator(entry);
    review.lastUpdatedAt = new Date().toISOString();

    return state;
  });
}

/**
 * In-page reason sheet.
 */
function askReason({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}) {
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

    if (onCancel) {
      onCancel();
    }
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

function renderSummaryStrip(
  pillar,
  isDiagnosticMode,
  cycle
) {
  const wrap = document.createElement("div");
  wrap.className = "stack-tight";

  const strip = document.createElement("div");
  strip.className = "summary-strip";

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

  if (!isDiagnosticMode) {
    const ready = document.createElement("p");
    ready.className = "pillar-ready text-caption";

    const hasEvidence =
      pillar.evidence.length > 0;

    const hasScore =
      pillar.maturityScore != null;

    const hasConfidence =
      Boolean(
        pillar.assessorConfidence?.level
      );

    if (hasEvidence && hasScore) {
      ready.textContent = hasConfidence
        ? "Ready to mark this pillar complete"
        : "Ready to mark complete. Confidence still optional but useful.";

      ready.classList.add(
        "pillar-ready--ok"
      );
    } else {
      const missing = [];

      if (!hasEvidence) {
        missing.push("evidence");
      }

      if (!hasScore) {
        missing.push("maturity score");
      }

      ready.textContent =
        "Still needed: " +
        missing.join(" and ");
    }

    wrap.append(ready);
  }

  return wrap;
}

function renderMethodologyQuestions(
  container,
  pillar,
  review,
  org,
  refresh
) {
  const questions =
    PILLAR_QUESTIONS[pillar.pillarKey] || [];

  const sectionHeading =
    document.createElement("h2");

  sectionHeading.className =
    "text-heading-section";

  sectionHeading.textContent =
    "Questions";

  container.append(sectionHeading);

  if (questions.length === 0) {
    const empty =
      document.createElement("p");

    empty.className =
      "text-body-secondary pillar-questions-empty";

    empty.textContent =
      "Assessment questions for this pillar are not authored yet. Capture evidence under Your judgement below, then score the pillar.";

    container.append(empty);

    return;
  }

  questions.forEach((q) => {
    const questionWrap =
      document.createElement("div");

    questionWrap.className =
      "question-block stack-tight";

    const route =
      q.investigationRoute ||
      "ASK_THEN_EVIDENCE";

    const observeFirst =
      route === "OBSERVE_THEN_ASK" ||
      route === "OBSERVE_ASK_EVIDENCE";

    const existing =
      pillar.questionResponses?.[q.id] || {};

    const existingObserved =
      existing.observed || "";

    const existingLearned =
      existing.learned ||
      existing.response ||
      "";

    const PLACEHOLDERS = {
      "q1-first-impression": {
        observed:
          "e.g. Entrance tidy, signage inconsistent, no staff visible on arrival.",
        learned:
          "e.g. Manager says duty supervisor signs a daily check. No checklist seen.",
      },

      "q2-wayfinding-responsiveness": {
        observed:
          "e.g. Aisle signs unclear, customers looking lost, staff hard to find on the floor.",
        learned:
          "e.g. Staff say they help when asked. No set coverage for the trade counter at peak.",
      },

      "q3-complaint-issue-handling": {
        observed: "",
        learned:
          "e.g. Last complaint was last month. Branch manager owned it. Not clear if it was logged.",
      },

      "q4-customer-satisfaction-awareness": {
        observed: "",
        learned:
          "e.g. Owner knows regulars by name and notices when someone stops calling. No formal survey.",
      },

      "q5-consistency-of-interaction": {
        observed:
          "e.g. One colleague greeted well and knew the product; another barely looked up.",
        learned:
          "e.g. Service is picked up on the job. No shared standard beyond 'be helpful'.",
      },
    };

    const ph =
      PLACEHOLDERS[q.id] || {
        observed:
          "Short factual notes on what you saw. A sentence or two is enough.",
        learned:
          "What the manager or staff told you. Keep it brief.",
      };

    function saveQuestionField(
      fieldName,
      value
    ) {
      mutatePillar(
        org.id,
        review.id,
        pillar.pillarKey,
        (p) => {
          if (!p.questionResponses) {
            p.questionResponses = {};
          }

          const current =
            p.questionResponses[q.id] || {
              observed: "",
              learned: "",
              response: "",
              evidenceNotes: "",
              capturedAt: null,
            };

          const next = {
            ...current,
            [fieldName]: value,
            capturedAt:
              current.capturedAt ||
              new Date().toISOString(),
          };

          if (
            fieldName === "learned"
          ) {
            next.response = value;
          }

          p.questionResponses[q.id] =
            next;
        }
      );
    }

    const questionText =
      document.createElement("p");

    questionText.className =
      "question-block__text";

    questionText.textContent =
      q.question;

    questionWrap.append(
      questionText
    );

    if (observeFirst) {
      const observeLabel =
        document.createElement("p");

      observeLabel.className =
        "field__label";

      observeLabel.textContent =
        "What I observed";

      const observeHint =
        document.createElement("p");

      observeHint.className =
        "text-caption";

      observeHint.textContent =
        "Look first. Short factual notes. A sentence or two is enough. Not the final judgement.";

      questionWrap.append(
        observeLabel,
        observeHint
      );

      if (
        Array.isArray(q.whatToObserve) &&
        q.whatToObserve.length > 0
      ) {
        const lookFor =
          document.createElement("p");

        lookFor.className =
          "text-caption question-block__look-for";

        lookFor.textContent =
          "Look for: " +
          q.whatToObserve.join(", ");

        questionWrap.append(
          lookFor
        );
      }

      const observedField =
        createTextField({
          id: `question-observed-${q.id}`,
          label: "",
          textarea: true,
        });

      const lab =
        observedField.element.querySelector(
          ".field__label"
        );

      if (lab) {
        lab.style.display = "none";
      }

      observedField.input.value =
        existingObserved;

      observedField.input.rows = 2;

      observedField.input.placeholder =
        ph.observed;

      observedField.element.classList.add(
        "question-observed"
      );

      observedField.input.addEventListener(
        "input",
        () => {
          observedField.input.style.height =
            "auto";

          observedField.input.style.height =
            `${observedField.input.scrollHeight}px`;
        }
      );

      observedField.input.addEventListener(
        "blur",
        () => {
          saveQuestionField(
            "observed",
            observedField.input.value
          );
        }
      );

      questionWrap.append(
        observedField.element
      );

      const askCue =
        document.createElement("p");

      askCue.className =
        "text-caption question-block__ask-cue";

      askCue.textContent =
        "Then ask how this is normally maintained or done.";

      questionWrap.append(
        askCue
      );
    }

    const learnedLabel =
      document.createElement("p");

    learnedLabel.className =
      "field__label";

    learnedLabel.textContent =
      "What I learned";

    const learnedHint =
      document.createElement("p");

    learnedHint.className =
      "text-caption";

    learnedHint.textContent =
      observeFirst
        ? "What the manager or staff told you after you looked. Keep it brief."
        : "What the manager or staff told you, and any example they gave. Keep it brief.";

    const learnedField =
      createTextField({
        id: `question-learned-${q.id}`,
        label: "",
        textarea: true,
      });

    const learnedLab =
      learnedField.element.querySelector(
        ".field__label"
      );

    if (learnedLab) {
      learnedLab.style.display =
        "none";
    }

    learnedField.input.value =
      existingLearned;

    learnedField.input.rows = 2;

    learnedField.input.placeholder =
      ph.learned;

    learnedField.element.classList.add(
      "question-learned"
    );

    learnedField.input.addEventListener(
      "input",
      () => {
        learnedField.input.style.height =
          "auto";

        learnedField.input.style.height =
          `${learnedField.input.scrollHeight}px`;
      }
    );

    learnedField.input.addEventListener(
      "blur",
      () => {
        saveQuestionField(
          "learned",
          learnedField.input.value
        );
      }
    );

    questionWrap.append(
      learnedLabel,
      learnedHint,
      learnedField.element
    );

    const evLabel =
      document.createElement("p");

    evLabel.className =
      "field__label";

    evLabel.textContent =
      "Evidence";

    const evHint =
      document.createElement("p");

    evHint.className =
      "text-caption";

    evHint.textContent =
      "Optional. Add only what supports this question. Source required.";

    const questionEvidence =
      (pillar.evidence || []).filter(
        (e) => e.questionId === q.id
      );

    const evidenceEditor =
      createEvidenceListEditor({
        sourceTypes:
          EVIDENCE_SOURCE_TYPES,

        items:
          questionEvidence,

        onChange: (items) => {
          mutatePillar(
            org.id,
            review.id,
            pillar.pillarKey,
            (p) => {
              const others =
                (p.evidence || []).filter(
                  (e) =>
                    e.questionId !== q.id
                );

              const tagged =
                items.map(
                  (entry) => ({
                    ...entry,
                    questionId:
                      q.id,
                  })
                );

              p.evidence =
                others.concat(
                  tagged
                );
            }
          );

          refresh();
        },
      });

    evidenceEditor.classList.add(
      "question-evidence"
    );

    questionWrap.append(
      evLabel,
      evHint,
      evidenceEditor
    );

    questionWrap.append(
      createQuestionGuidance(q)
    );

    container.append(
      questionWrap
    );
  });

  const divider =
    document.createElement("hr");

  divider.className =
    "section-divider";

  container.append(divider);
}

/* ==========================================================================
   FROM THIS PILLAR
   ========================================================================== */

/**
 * Creates the evidence/findings context that sits immediately above
 * whichever judgement box the assessor has selected.
 *
 * This deliberately uses the information already captured in the pillar.
 * It does not invent a judgement or write the assessor's conclusion for them.
 */
function renderFindingContext(
  pillar,
  type
) {
  const wrap =
    document.createElement("div");

  wrap.className =
    "judgement-context";

  const heading =
    document.createElement("p");

  heading.className =
    "judgement-context__title";

  heading.textContent =
    "From this pillar";

  const subtitle =
    document.createElement("p");

  subtitle.className =
    "judgement-context__subtitle";

  const subtitles = {
    strengths:
      "Use the evidence below to identify what is working well.",

    opportunities:
      "Use the evidence below to identify gaps, inconsistency or areas of weaker maturity.",

    observation:
      "Use the evidence below to form a balanced professional view.",
  };

  subtitle.textContent =
    subtitles[type] ||
    subtitles.strengths;

  wrap.append(
    heading,
    subtitle
  );

  const questions =
    PILLAR_QUESTIONS[pillar.pillarKey] ||
    [];

  const responses =
    pillar.questionResponses || {};

  const evidence =
    pillar.evidence || [];

  let any = false;

  questions.forEach(
    (q, index) => {
      const response =
        responses[q.id] || {};

      const observed =
        (
          response.observed || ""
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
            e.questionId === q.id
        );

      if (
        !observed &&
        !learned &&
        qEvidence.length === 0
      ) {
        return;
      }

      any = true;

      const block =
        document.createElement("div");

      block.className =
        "judgement-context__question";

      const qTitle =
        document.createElement("p");

      qTitle.className =
        "judgement-context__question-title";

      const shortQuestion =
        q.question.length > 100
          ? q.question.slice(0, 97) +
            "..."
          : q.question;

      qTitle.textContent =
        `Q${index + 1}. ${shortQuestion}`;

      block.append(qTitle);

      if (observed) {
        const row =
          document.createElement("p");

        row.className =
          "judgement-context__row";

        const tag =
          document.createElement("span");

        tag.className =
          "judgement-context__tag";

        tag.textContent =
          "Observed";

        row.append(
          tag,
          document.createTextNode(
            " " + observed
          )
        );

        block.append(row);
      }

      if (learned) {
        const row =
          document.createElement("p");

        row.className =
          "judgement-context__row";

        const tag =
          document.createElement("span");

        tag.className =
          "judgement-context__tag";

        tag.textContent =
          "Learned";

        row.append(
          tag,
          document.createTextNode(
            " " + learned
          )
        );

        block.append(row);
      }

      qEvidence.forEach(
        (e) => {
          const row =
            document.createElement("p");

          row.className =
            "judgement-context__row";

          const tag =
            document.createElement("span");

          tag.className =
            "judgement-context__tag";

          tag.textContent =
            e.sourceType ||
            "Evidence";

          row.append(
            tag,
            document.createTextNode(
              " " +
                (e.content || "")
            )
          );

          block.append(row);
        }
      );

      wrap.append(block);
    }
  );

  const otherEvidence =
    evidence.filter(
      (e) => !e.questionId
    );

  if (
    otherEvidence.length > 0
  ) {
    any = true;

    const block =
      document.createElement("div");

    block.className =
      "judgement-context__question";

    const title =
      document.createElement("p");

    title.className =
      "judgement-context__question-title";

    title.textContent =
      questions.length
        ? "Other evidence"
        : "Evidence";

    block.append(title);

    otherEvidence.forEach(
      (e) => {
        const row =
          document.createElement("p");

        row.className =
          "judgement-context__row";

        const tag =
          document.createElement("span");

        tag.className =
          "judgement-context__tag";

        tag.textContent =
          e.sourceType ||
          "Evidence";

        row.append(
          tag,
          document.createTextNode(
            " " +
              (e.content || "")
          )
        );

        block.append(row);
      }
    );

    wrap.append(block);
  }

  if (!any) {
    const empty =
      document.createElement("p");

    empty.className =
      "judgement-context__empty";

    empty.textContent =
      "No investigation notes or evidence have been captured on this pillar yet.";

    wrap.append(empty);
  }

  return wrap;
}

/* ==========================================================================
   HEALTH REVIEW LAYER
   ========================================================================== */

function renderHealthReviewLayer(
  container,
  pillar,
  review,
  org,
  refresh
) {
  const guidance =
    PILLAR_GUIDANCE[pillar.pillarKey];

  renderMethodologyQuestions(
    container,
    pillar,
    review,
    org,
    refresh
  );

  const pillarAssessmentHeading =
    document.createElement("h2");

  pillarAssessmentHeading.className =
    "text-heading-section";

  pillarAssessmentHeading.textContent =
    "Your judgement";

  container.append(
    pillarAssessmentHeading
  );

  /* ------------------------------------------------------------------------
     Judgement selector
     ------------------------------------------------------------------------ */

  const judgementSelector =
    document.createElement("div");

  judgementSelector.className =
    "judgement-selector";

  const judgementOptions = [
    {
      key: "strengths",
      label: "Strengths",
    },
    {
      key: "opportunities",
      label: "Opportunities",
    },
    {
      key: "observation",
      label: "Professional Observation",
    },
  ];

  const judgementContent =
    document.createElement("div");

  judgementContent.className =
    "judgement-content";

  let activeJudgement =
    "strengths";

  function renderJudgement() {
    judgementContent.innerHTML =
      "";

    const context =
      renderFindingContext(
        pillar,
        activeJudgement
      );

    judgementContent.append(
      context
    );

    /* ----------------------------------------------------------------------
       Strengths
       ---------------------------------------------------------------------- */

    if (
      activeJudgement ===
      "strengths"
    ) {
      const label =
        document.createElement("p");

      label.className =
        "field__label";

      label.textContent =
        "Strengths";

      const editor =
        createFreeTextAreaField({
          placeholder:
            "What is working well? One point per line.",
          items:
            pillar.strengths,

          onChange: (items) => {
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

      judgementContent.append(
        label,
        editor
      );

      return;
    }

    /* ----------------------------------------------------------------------
       Opportunities
       ---------------------------------------------------------------------- */

    if (
      activeJudgement ===
      "opportunities"
    ) {
      const label =
        document.createElement("p");

      label.className =
        "field__label";

      label.textContent =
        "Opportunities";

      const hint =
        document.createElement("p");

      hint.className =
        "text-caption";

      hint.textContent =
        "Name the gap or inconsistency, not the fix. One point per line.";

      const editor =
        createFreeTextAreaField({
          placeholder:
            "Where could operational maturity improve?",
          items:
            pillar.opportunities,

          onChange: (items) => {
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

      judgementContent.append(
        label,
        hint,
        editor,

        createGuidancePanel(
          guidance.opportunities
        )
      );

      return;
    }

    /* ----------------------------------------------------------------------
       Professional Observation
       ---------------------------------------------------------------------- */

    if (
      activeJudgement ===
      "observation"
    ) {
      const profObs =
        createTextField({
          id: "professionalObservation",
          label:
            "Professional observation (client-visible)",
          textarea: true,
        });

      profObs.input.value =
        pillar.professionalObservation;

      profObs.input.placeholder =
        "Clear, balanced summary for the client. Factual and professional. No internal confidence. No full action plan.";

      const profObsHint =
        document.createElement("p");

      profObsHint.className =
        "text-caption";

      profObsHint.textContent =
        "This appears in the client report. Write as you would to the business owner: tight, neutral, useful.";

      profObs.input.addEventListener(
        "blur",
        () => {
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

      judgementContent.append(
        profObs.element,
        profObsHint,

        createGuidancePanel(
          guidance.professionalObservation
        )
      );
    }
  }

  judgementOptions.forEach(
    (option) => {
      const button =
        document.createElement("button");

      button.type = "button";

      button.className =
        "judgement-selector__button";

      button.textContent =
        option.label;

      if (
        option.key ===
        activeJudgement
      ) {
        button.classList.add(
          "judgement-selector__button--active"
        );
      }

      button.addEventListener(
        "click",
        () => {
          activeJudgement =
            option.key;

          Array.from(
            judgementSelector.children
          ).forEach(
            (child) => {
              child.classList.remove(
                "judgement-selector__button--active"
              );
            }
          );

          button.classList.add(
            "judgement-selector__button--active"
          );

          renderJudgement();
        }
      );

      judgementSelector.append(
        button
      );
    }
  );

  container.append(
    judgementSelector,
    judgementContent
  );

  renderJudgement();

  /* ------------------------------------------------------------------------
     Earlier / orphan evidence
     ------------------------------------------------------------------------ */

  const authoredQuestions =
    (
      PILLAR_QUESTIONS[
        pillar.pillarKey
      ] || []
    ).length > 0;

  const orphanEvidence =
    (pillar.evidence || []).filter(
      (e) => !e.questionId
    );

  if (
    authoredQuestions &&
    orphanEvidence.length > 0
  ) {
    const orphanLabel =
      document.createElement("p");

    orphanLabel.className =
      "field__label";

    orphanLabel.textContent =
      "Earlier evidence (not linked to a question)";

    const orphanHint =
      document.createElement("p");

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

        onChange: (items) => {
          mutatePillar(
            org.id,
            review.id,
            pillar.pillarKey,
            (p) => {
              const linked =
                (p.evidence || []).filter(
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
                      } = entry;

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

  if (!authoredQuestions) {
    const evidenceLabel =
      document.createElement("p");

    evidenceLabel.className =
      "field__label";

    evidenceLabel.textContent =
      "Evidence";

    const evidenceHint =
      document.createElement("p");

    evidenceHint.className =
      "text-caption";

    evidenceHint.textContent =
      "No assessment questions for this pillar yet. Capture at least one evidence item here before marking complete.";

    const evidenceEditor =
      createEvidenceListEditor({
        sourceTypes:
          EVIDENCE_SOURCE_TYPES,

        items:
          pillar.evidence || [],

        onChange: (items) => {
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

  /* ------------------------------------------------------------------------
     Internal assessor notes
     ------------------------------------------------------------------------ */

  const internalNotes =
    createTextField({
      id: "internalAssessorNotes",
      label:
        "Internal assessor notes (never client-visible)",
      textarea: true,
    });

  internalNotes.element.classList.add(
    "field--internal"
  );

  internalNotes.input.value =
    pillar.internalAssessorNotes;

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

  /* ------------------------------------------------------------------------
     Maturity score
     ------------------------------------------------------------------------ */

  const scoreLabel =
    document.createElement("p");

  scoreLabel.className =
    "field__label";

  scoreLabel.textContent =
    "Maturity score";

  const scoreSelector =
    createScoreSelector({
      value:
        pillar.maturityScore,

      onChange: (score) => {
        const previousScore =
          pillar.maturityScore;

        function commit(reason) {
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
                  (previousScore ==
                  null
                    ? "Initial score"
                    : ""),
              });
            }
          );

          refresh();
        }

        if (
          previousScore != null &&
          previousScore !== score
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

  /* ------------------------------------------------------------------------
     Assessor confidence
     ------------------------------------------------------------------------ */

  const confidenceLabel =
    document.createElement("p");

  confidenceLabel.className =
    "field__label";

  confidenceLabel.textContent =
    "Assessor confidence (internal only)";

  const confidenceRow =
    document.createElement("div");

  confidenceRow.className =
    "confidence-row";

  CONFIDENCE_LEVELS.forEach(
    (level) => {
      const selected =
        pillar.assessorConfidence
          ?.level === level;

      const btn =
        createButton({
          label: level,

          variant:
            selected
              ? "primary"
              : "secondary",

          onClick: () => {
            const previous =
              pillar.assessorConfidence
                ?.level;

            function commit(reason) {
              mutatePillar(
                org.id,
                review.id,
                pillar.pillarKey,
                (p) => {
                  p.assessorConfidence =
                    {
                      level,

                      reason:
                        reason || "",
                    };
                }
              );

              refresh();
            }

            if (
              previous &&
              previous !== level
            ) {
              askReason({
                title:
                  "Confidence change",

                message:
                  `Changing from ${previous} to ${level}. Optional note for your own reference.`,

                confirmLabel:
                  "Save",

                onConfirm:
                  commit,
              });

              return;
            }

            commit(
              pillar
                .assessorConfidence
                ?.reason || ""
            );
          },
        });

      if (selected) {
        btn.classList.add(
          "confidence-row__selected"
        );
      }

      confidenceRow.append(
        btn
      );
    }
  );

  container.append(
    confidenceLabel,
    confidenceRow,

    createGuidancePanel(
      guidance.assessorConfidence
    )
  );
}

/* ==========================================================================
   DIAGNOSTIC LAYER
   ========================================================================== */

function renderDiagnosticLayer(
  container,
  pillarKey,
  cycleEntry,
  review,
  org,
  cycleId,
  refresh
) {
  const divider =
    document.createElement("hr");

  divider.className =
    "section-divider";

  const heading =
    document.createElement("h2");

  heading.className =
    "text-heading-section";

  heading.textContent =
    "Operational Diagnostic";

  const rootCause =
    createTextField({
      id: "rootCauseAnalysis",
      label:
        "Root cause analysis",
      textarea: true,
    });

  rootCause.input.value =
    cycleEntry.rootCauseAnalysis;

  rootCause.input.addEventListener(
    "blur",
    () => {
      mutateCyclePillar(
        org.id,
        review.id,
        cycleId,
        pillarKey,
        (e) => {
          e.rootCauseAnalysis =
            rootCause.input.value;
        }
      );
    }
  );

  const risk =
    createTextField({
      id: "operationalRisk",
      label:
        "Operational risk",
      textarea: true,
    });

  risk.input.value =
    cycleEntry.operationalRisk;

  risk.input.addEventListener(
    "blur",
    () => {
      mutateCyclePillar(
        org.id,
        review.id,
        cycleId,
        pillarKey,
        (e) => {
          e.operationalRisk =
            risk.input.value;
        }
      );
    }
  );

  const cost =
    createTextField({
      id: "costOfInaction",
      label:
        "Cost of inaction",
      textarea: true,
    });

  cost.input.value =
    cycleEntry.costOfInaction;

  cost.input.addEventListener(
    "blur",
    () => {
      mutateCyclePillar(
        org.id,
        review.id,
        cycleId,
        pillarKey,
        (e) => {
          e.costOfInaction =
            cost.input.value;
        }
      );
    }
  );

  const recLabel =
    document.createElement("p");

  recLabel.className =
    "field__label";

  recLabel.textContent =
    "Recommendations (client-visible, paid tier)";

  const recEditor =
    createTextListEditor({
      placeholder:
        "What should change?",

      items:
        cycleEntry.recommendations.map(
          (r) => r.text
        ),

      onChange: (texts) => {
        mutateCyclePillar(
          org.id,
          review.id,
          cycleId,
          pillarKey,
          (e) => {
            e.recommendations =
              texts.map(
                (text, i) => ({
                  id:
                    e.recommendations[
                      i
                    ]?.id ||
                    `rec_${Date.now().toString(
                      36
                    )}_${i}`,

                  text,

                  businessImpact: [],
                })
              );
          }
        );
      },
    });

  const planLabel =
    document.createElement("p");

  planLabel.className =
    "field__label";

  planLabel.textContent =
    "Implementation plan (client-visible, paid tier)";

  const planEditor =
    createTextListEditor({
      placeholder:
        "e.g. Week 1: Develop briefing template",

      items:
        cycleEntry.implementationPlan.map(
          (s) => s.step
        ),

      onChange: (steps) => {
        mutateCyclePillar(
          org.id,
          review.id,
          cycleId,
          pillarKey,
          (e) => {
            e.implementationPlan =
              steps.map(
                (step, i) => ({
                  id:
                    e.implementationPlan[
                      i
                    ]?.id ||
                    `plan_${Date.now().toString(
                      36
                    )}_${i}`,

                  step,

                  timeframe:
                    e
                      .implementationPlan[
                      i
                    ]?.timeframe ||
                    "",
                })
              );
          }
        );
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

/* ==========================================================================
   MAIN RENDER
   ========================================================================== */

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
    document.createElement("div");

  screen.className =
    "screen stack";

  if (
    !org ||
    !review ||
    !pillar
  ) {
    const notFound =
      document.createElement("p");

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
    Boolean(params.cycleId);

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
      document.createElement("p");

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
      document.createElement("p");

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
    document.createElement("h1");

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
    document.createElement("div");

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

  if (isDiagnosticMode) {
    if (diagnosticLocked) {
      const lockedNotice =
        document.createElement("p");

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

  const actions =
    document.createElement("div");

  actions.className =
    "screen-actions stack-tight";

  if (!diagnosticLocked) {
    if (isDiagnosticMode) {
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

          onClick: () => {
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
        pillar.evidence.length > 0 &&
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

          onClick: () => {
            if (!canComplete) {
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

      onClick: () =>
        back(),
    })
  );

  screen.append(
    actions
  );

  container.append(
    screen
  );
}
