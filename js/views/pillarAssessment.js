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
  const org =
    state.organisations.find(
      (o) =>
        o.id ===
        organisationId
    );

  const review =
    org?.reviews.find(
      (r) =>
        r.id ===
        reviewId
    );

  const pillar =
    review?.pillarAssessments.find(
      (p) =>
        p.pillarKey ===
        pillarKey
    );

  return {
    org,
    review,
    pillar,
  };
}

function findCycle(
  review,
  cycleId
) {
  return (
    review?.diagnosticCycles.find(
      (c) =>
        c.id ===
        cycleId
    ) || null
  );
}

function mutatePillar(
  organisationId,
  reviewId,
  pillarKey,
  mutator
) {
  updateState(
    (state) => {
      const {
        review,
        pillar,
      } =
        findPillar(
          state,
          organisationId,
          reviewId,
          pillarKey
        );

      if (!pillar) {
        return state;
      }

      mutator(
        pillar,
        review
      );

      review.lastUpdatedAt =
        new Date().toISOString();

      return state;
    }
  );
}

function mutateCyclePillar(
  organisationId,
  reviewId,
  cycleId,
  pillarKey,
  mutator
) {
  updateState(
    (state) => {
      const {
        review,
      } =
        findPillar(
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
        cycle?.pillars[
          pillarKey
        ];

      if (!entry) {
        return state;
      }

      mutator(entry);

      review.lastUpdatedAt =
        new Date().toISOString();

      return state;
    }
  );
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
    document.createElement(
      "div"
    );

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
    document.createElement(
      "div"
    );

  panel.className =
    "reason-sheet__panel";

  const heading =
    document.createElement(
      "p"
    );

  heading.className =
    "reason-sheet__title";

  heading.textContent =
    title;

  const body =
    document.createElement(
      "p"
    );

  body.className =
    "reason-sheet__message";

  body.textContent =
    message;

  const input =
    document.createElement(
      "textarea"
    );

  input.className =
    "field__input reason-sheet__input";

  input.rows = 3;

  input.placeholder =
    "Optional note";

  const row =
    document.createElement(
      "div"
    );

  row.className =
    "reason-sheet__actions";

  const cancelBtn =
    document.createElement(
      "button"
    );

  cancelBtn.type =
    "button";

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
    document.createElement(
      "button"
    );

  okBtn.type =
    "button";

  okBtn.className =
    "btn btn-primary";

  okBtn.textContent =
    confirmLabel ||
    "Save";

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

  overlay.append(
    panel
  );

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
    document.createElement(
      "div"
    );

  wrap.className =
    "stack-tight";

  const strip =
    document.createElement(
      "div"
    );

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
        pillar.evidence.length ===
        1
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
      pillar.evidence.length >
      0;

    const hasScore =
      pillar.maturityScore !=
      null;

    const hasConfidence =
      Boolean(
        pillar
          .assessorConfidence
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

function renderMethodologyQuestions(
  container,
  pillar,
  review,
  org,
  refresh
) {
  const questions =
    PILLAR_QUESTIONS[
      pillar.pillarKey
    ] || [];

  const sectionHeading =
    document.createElement(
      "h2"
    );

  sectionHeading.className =
    "text-heading-section";

  sectionHeading.textContent =
    "Questions";

  container.append(
    sectionHeading
  );

  if (
    questions.length ===
    0
  ) {
    const empty =
      document.createElement(
        "p"
      );

    empty.className =
      "text-body-secondary pillar-questions-empty";

    empty.textContent =
      "Assessment questions for this pillar are not authored yet. Capture evidence under Your judgement below, then score the pillar.";

    container.append(
      empty
    );

    return;
  }

  questions.forEach(
    (q) => {
      const questionWrap =
        document.createElement(
          "div"
        );

      questionWrap.className =
        "question-block stack-tight";

      const route =
        q.investigationRoute ||
        "ASK_THEN_EVIDENCE";

      const observeFirst =
        route ===
          "OBSERVE_THEN_ASK" ||
        route ===
          "OBSERVE_ASK_EVIDENCE";

      const existing =
        pillar
          .questionResponses?.[
          q.id
        ] || {};

      const existingObserved =
        existing.observed ||
        "";

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
          observed:
            "",

          learned:
            "e.g. Last complaint was last month. Branch manager owned it. Not clear if it was logged.",
        },

        "q4-customer-satisfaction-awareness": {
          observed:
            "",

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
        PLACEHOLDERS[
          q.id
        ] || {
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
            if (
              !p.questionResponses
            ) {
              p.questionResponses =
                {};
            }

            const current =
              p.questionResponses[
                q.id
              ] || {
                observed:
                  "",
                learned:
                  "",
                response:
                  "",
                evidenceNotes:
                  "",
                capturedAt:
                  null,
              };

            const next = {
              ...current,
              [fieldName]:
                value,

              capturedAt:
                current.capturedAt ||
                new Date().toISOString(),
            };

            if (
              fieldName ===
              "learned"
            ) {
              next.response =
                value;
            }

            p.questionResponses[
              q.id
            ] = next;
          }
        );
      }

      const questionText =
        document.createElement(
          "p"
        );

      questionText.className =
        "question-block__text";

      questionText.textContent =
        q.question;

      questionWrap.append(
        questionText
      );

      if (observeFirst) {
        const observeLabel =
          document.createElement(
            "p"
          );

        observeLabel.className =
          "field__label";

        observeLabel.textContent =
          "What I observed";

        const observeHint =
          document.createElement(
            "p"
          );

        observeHint.className =
          "text-caption";

        observeHint.textContent =
          "Look first. Short factual notes. A sentence or two is enough. Not the final judgement.";

        questionWrap.append(
          observeLabel,
          observeHint
        );

        if (
          Array.isArray(
            q.whatToObserve
          ) &&
          q.whatToObserve.length >
            0
        ) {
          const lookFor =
            document.createElement(
              "p"
            );

          lookFor.className =
            "text-caption question-block__look-for";

          lookFor.textContent =
            "Look for: " +
            q.whatToObserve.join(
              ", "
            );

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
          lab.style.display =
            "none";
        }

        observedField.input.value =
          existingObserved;

        observedField.input.rows =
          2;

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
          document.createElement(
            "p"
          );

        askCue.className =
          "text-caption question-block__ask-cue";

        askCue.textContent =
          "Then ask how this is normally maintained or done.";

        questionWrap.append(
          askCue
        );
      }

      const learnedLabel =
        document.createElement(
          "p"
        );

      learnedLabel.className =
        "field__label";

      learnedLabel.textContent =
        "What I learned";

      const learnedHint =
        document.createElement(
          "p"
        );

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

      learnedField.input.rows =
        2;

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
        document.createElement(
          "p"
        );

      evLabel.className =
        "field__label";

      evLabel.textContent =
        "Evidence";

      const evHint =
        document.createElement(
          "p"
        );

      evHint.className =
        "text-caption";

      evHint.textContent =
        "Optional. Add only what supports this question. Source required.";

      const questionEvidence =
        (
          pillar.evidence ||
          []
        ).filter(
          (e) =>
            e.questionId ===
            q.id
        );

      const evidenceEditor =
        createEvidenceListEditor({
          sourceTypes:
            EVIDENCE_SOURCE_TYPES,

          items:
            questionEvidence,

          onChange:
            (items) => {
              mutatePillar(
                org.id,
                review.id,
                pillar.pillarKey,
                (p) => {
                  const others =
                    (
                      p.evidence ||
                      []
                    ).filter(
                      (e) =>
                        e.questionId !==
                        q.id
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
        createQuestionGuidance(
          q
        )
      );

      container.append(
        questionWrap
      );
    }
  );

  const divider =
    document.createElement(
      "hr"
    );

  divider.className =
    "section-divider";

  container.append(
    divider
  );
}

// ==========================================================================
// FROM THIS PILLAR
// ==========================================================================
//
// Contextual information for the judgement currently being worked on.
//
// IMPORTANT UX RULE
// --------------------------------------------------------------------------
// The panel is created as part of each judgement section but is hidden until
// that judgement field is selected/focused.
//
// Therefore the visual order is:
//
//   FROM THIS PILLAR
//   STRENGTHS
//   Hint
//   Input
//
// or:
//
//   FROM THIS PILLAR
//   OPPORTUNITIES
//   Hint
//   Input
//
// The "From this pillar" panel NEVER moves above the judgement title.
// ==========================================================================

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

  // Hidden until the associated judgement field is selected.
  wrap.hidden = true;

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
    mode ===
    "strengths"
  ) {
    subtitle.textContent =
      "Investigation information to consider when identifying what is working well.";
  } else if (
    mode ===
    "opportunities"
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
      (e) =>
        !e.questionId
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
// STRUCTURE IS LOCKED:
//
//   [From this pillar]
//   [STRENGTHS / OPPORTUNITIES / PROFESSIONAL OBSERVATION]
//   [Hint]
//   [Input]
//
// The contextual panel is hidden until the judgement field is selected.
//
// Selecting another judgement field automatically hides the previous
// contextual panel and reveals the new one.
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
  // CONTEXT FIRST
  // --------------------------------------------------------

  const sourcePanel =
    createFromPillarPanel(
      pillar,
      mode
    );

  section.append(
    sourcePanel
  );

  // --------------------------------------------------------
  // JUDGEMENT TITLE
  //
  // This MUST remain BELOW the From this pillar box.
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
      items:
        value || [],

      onChange:
        (items) => {
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
  // CONTEXTUAL PANEL BEHAVIOUR
  // --------------------------------------------------------
  //
  // The panel belongs ONLY to this judgement section.
  //
  // When this section receives focus/click:
  //   - its panel appears
  //   - every other judgement panel disappears
  //
  // When focus moves elsewhere:
  //   - the panel remains if focus is still within this section
  //
  // This prevents the panel from disappearing while the assessor is
  // actively typing or interacting with the input.
  // --------------------------------------------------------

  function showContext() {
    document
      .querySelectorAll(
        ".judgement-section .from-pillar"
      )
      .forEach(
        (panel) => {
          panel.hidden =
            panel !==
            sourcePanel;
        }
      );

    sourcePanel.hidden =
      false;
  }

  section.addEventListener(
    "focusin",
    () => {
      showContext();
    }
  );

  section.addEventListener(
    "pointerdown",
    () => {
      showContext();
    }
  );

  section.addEventListener(
    "click",
    () => {
      showContext();
    }
  );

  return section;
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

      mode:
        "strengths",

      label:
        "Strengths",

      hint:
        "What is working well? Write your professional judgement. One point per line.",

      placeholder:
        "What is working well?",

      value:
        pillar.strengths,

      onSave:
        (items) => {
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

      mode:
        "opportunities",

      label:
        "Opportunities",

      hint:
        "Name the gap or inconsistency, not the fix. One point per line.",

      placeholder:
        "Where could operational maturity improve?",

      value:
        pillar.opportunities,

      onSave:
        (items) => {
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
  //
  // This is deliberately the FIRST element in this section.
  // The Professional Observation title stays BELOW it.
  // --------------------------------------------------------

  const professionalSource =
    createFromPillarPanel(
      pillar,
      "professionalObservation"
    );

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
  // CONTEXTUAL JUDGEMENT SUMMARY
  //
  // These are added INSIDE the From this pillar box.
  // They do not replace the investigation information.
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
  // PROFESSIONAL OBSERVATION HINT
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
  // PROFESSIONAL OBSERVATION INPUT
  // --------------------------------------------------------

  const profObs =
    createTextField({
      id:
        "professionalObservation",

      label:
        "",

      textarea:
        true,
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

  professionalSection.append(
    profObs.element
  );

  // --------------------------------------------------------
  // PROFESSIONAL OBSERVATION CONTEXT BEHAVIOUR
  // --------------------------------------------------------

  function showProfessionalContext() {
    document
      .querySelectorAll(
        ".judgement-section .from-pillar"
      )
      .forEach(
        (panel) => {
          panel.hidden =
            panel !==
            professionalSource;
        }
      );

    professionalSource.hidden =
      false;
  }

  professionalSection.addEventListener(
    "focusin",
    () => {
      showProfessionalContext();
    }
  );

  professionalSection.addEventListener(
    "pointerdown",
    () => {
      showProfessionalContext();
    }
  );

  professionalSection.addEventListener(
    "click",
    () => {
      showProfessionalContext();
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

      textarea:
        true,
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
      (e) =>
        !e.questionId
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
                      (
                        entry
                      ) => {
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
  // CONFIDENCE
  // --------------------------------------------------------

  const confidenceLabel =
    document.createElement(
      "p"
    );

  confidenceLabel.className =
    "field__label";

  confidenceLabel.textContent =
    "Assessor confidence (internal only)";

  const confidenceRow =
    document.createElement(
      "div"
    );

  confidenceRow.className =
    "confidence-row";

  CONFIDENCE_LEVELS.forEach(
    (level) => {
      const selected =
        pillar
          .assessorConfidence
          ?.level ===
        level;

      const btn =
        createButton({
          label:
            level,

          variant:
            selected
              ? "primary"
              : "secondary",

          onClick:
            () => {
              const previous =
                pillar
                  .assessorConfidence
                  ?.level;

              function commit(
                reason
              ) {
                mutatePillar(
                  org.id,
                  review.id,
                  pillar.pillarKey,
                  (p) => {
                    p.assessorConfidence =
                      {
                        level,

                        reason:
                          reason ||
                          "",
                      };
                  }
                );

                refresh();
              }

              if (
                previous &&
                previous !==
                  level
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
                  ?.reason ||
                  ""
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

// ==========================================================================
// DIAGNOSTIC LAYER
// ==========================================================================

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
    document.createElement(
      "hr"
    );

  divider.className =
    "section-divider";

  const heading =
    document.createElement(
      "h2"
    );

  heading.className =
    "text-heading-section";

  heading.textContent =
    "Operational Diagnostic";

  const rootCause =
    createTextField({
      id:
        "rootCauseAnalysis",

      label:
        "Root cause analysis",

      textarea:
        true,
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
      id:
        "operationalRisk",

      label:
        "Operational risk",

      textarea:
        true,
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
      id:
        "costOfInaction",

      label:
        "Cost of inaction",

      textarea:
        true,
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
    document.createElement(
      "p"
    );

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
          (r) =>
            r.text
        ),

      onChange:
        (texts) => {
          mutateCyclePillar(
            org.id,
            review.id,
            cycleId,
            pillarKey,
            (e) => {
              e.recommendations =
                texts.map(
                  (
                    text,
                    i
                  ) => ({
                    id:
                      e
                        .recommendations[
                        i
                      ]?.id ||
                      `rec_${Date.now().toString(
                        36
                      )}_${i}`,

                    text,

                    businessImpact:
                      [],
                  })
                );
            }
          );
        },
    });

  const planLabel =
    document.createElement(
      "p"
    );

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
          (s) =>
            s.step
        ),

      onChange:
        (steps) => {
          mutateCyclePillar(
            org.id,
            review.id,
            cycleId,
            pillarKey,
            (e) => {
              e.implementationPlan =
                steps.map(
                  (
                    step,
                    i
                  ) => ({
                    id:
                      e
                        .implementationPlan[
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
        () =>
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
