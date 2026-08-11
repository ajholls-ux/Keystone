// ==========================================================================
// Keystone Field Kit — Assessment Complete View
//
// Screen 8 of the locked Screen Map. Handles two distinct completion
// moments: Health Review (generates Client Report) and Diagnostic
// (locks the Review, generates Diagnostic Report). Milestone 3.5 adds the
// Operational Health Indicator and assessor recommendation step here.
// ==========================================================================

import { getState, updateState } from "../state/store.js";
import {
  DIAGNOSTIC_RECOMMENDATION_OPTIONS,
  calculateHealthIndicator,
  isRecommendationAligned,
} from "../state/schema.js";
import { createButton } from "../components/button.js";
import { replace, back } from "../router.js";

function findReview(state, organisationId, reviewId) {
  const org = state.organisations.find((o) => o.id === organisationId);
  const review = org?.reviews.find((r) => r.id === reviewId);
  return { org, review };
}

function renderHealthReviewCompletion(screen, org, review) {
  const heading = document.createElement("h1");
  heading.className = "text-heading-screen";
  heading.textContent = "Assessment Complete";

  const subhead = document.createElement("p");
  subhead.className = "text-body-secondary";
  subhead.textContent = "The Operational Health Review is complete for all ten pillars.";

  const indicator = calculateHealthIndicator(review.pillarAssessments);

  const indicatorRow = document.createElement("div");
  indicatorRow.className = "health-indicator";
  indicatorRow.innerHTML = `<span class="health-indicator__emoji">${indicator.emoji}</span><span>${indicator.label}</span>`;

  const indicatorMeaning = document.createElement("p");
  indicatorMeaning.className = "text-body-secondary";
  indicatorMeaning.textContent = indicator.meaning || "";

  const indicatorNote = document.createElement("p");
  indicatorNote.className = "text-caption";
  indicatorNote.textContent =
    "This indicator is decision support only. It never replaces your professional judgement.";

  const recLabel = document.createElement("p");
  recLabel.className = "field__label";
  recLabel.textContent = "Your recommendation";

  const recRow = document.createElement("div");
  recRow.className = "stack-tight";

  let selected = review.diagnosticRecommendation;
  const optionButtons = [];

  function updateSelectionStyling() {
    optionButtons.forEach(({ key, btn }) => {
      btn.className = `btn btn-${selected === key ? "primary" : "secondary"}`;
    });
  }

  DIAGNOSTIC_RECOMMENDATION_OPTIONS.forEach(({ key, label }) => {
    const btn = createButton({
      label,
      variant: selected === key ? "primary" : "secondary",
      onClick: () => {
        selected = key;
        updateSelectionStyling();
      },
    });
    optionButtons.push({ key, btn });
    recRow.append(btn);
  });

  const generateBtn = createButton({
    label: "Generate Client Report",
    variant: "primary",
    onClick: () => {
      if (!selected) {
        window.alert("Please select a recommendation before generating the report.");
        return;
      }

      let justification = review.recommendationJustification || "";
      if (!isRecommendationAligned(indicator.level, selected)) {
        justification =
          window.prompt(
            `This recommendation appears inconsistent with the current Health Indicator. Please explain the evidence or circumstances that support your judgement.`
          ) || "";
        if (!justification.trim()) {
          window.alert("A justification is required when the recommendation differs from the indicator.");
          return;
        }
      }

      updateState((s) => {
        const { review: r } = findReview(s, org.id, review.id);
        r.healthReviewCompletedAt = new Date().toISOString();
        r.clientReportGeneratedAt = new Date().toISOString();
        r.diagnosticRecommendation = selected;
        r.recommendationJustification = justification;
        r.lastUpdatedAt = new Date().toISOString();
        return s;
      });

      replace("analysisTransition", {
        organisationId: org.id,
        reviewId: review.id,
        reportType: "client",
      });
    },
  });

  screen.append(heading, subhead, indicatorRow, indicatorMeaning, indicatorNote, recLabel, recRow);

  const actions = document.createElement("div");
  actions.className = "screen-actions stack-tight";
  actions.append(generateBtn, createButton({ label: "Back", variant: "secondary", onClick: () => back() }));
  screen.append(actions);
}

function renderDiagnosticCompletion(screen, org, review, cycleId) {
  const cycle = review.diagnosticCycles.find((c) => c.id === cycleId);

  if (!cycle) {
    const notFound = document.createElement("p");
    notFound.className = "text-body-secondary";
    notFound.textContent = "Diagnostic cycle not found.";
    screen.append(notFound);
    return;
  }

  const heading = document.createElement("h1");
  heading.className = "text-heading-screen";
  heading.textContent = "Assessment Complete";

  const subhead = document.createElement("p");
  subhead.className = "text-body-secondary";
  subhead.textContent = `Diagnostic Cycle ${cycle.cycleNumber} is ready to be marked complete. This action is final for this cycle — its findings become a permanent historical record. The organisation remains open to future Diagnostic Cycles.`;

  const confirmBtn = createButton({
    label: `Complete Diagnostic Cycle ${cycle.cycleNumber}`,
    variant: "primary",
    onClick: () => {
      const confirmed = window.confirm(
        `This will lock Diagnostic Cycle ${cycle.cycleNumber} permanently. Its findings cannot be edited afterward. Continue?`
      );
      if (!confirmed) return;

      updateState((s) => {
        const { review: r } = findReview(s, org.id, review.id);
        const c = r.diagnosticCycles.find((cy) => cy.id === cycleId);
        c.completedAt = new Date().toISOString();
        c.reportGeneratedAt = new Date().toISOString();
        c.locked = true;
        r.lastUpdatedAt = new Date().toISOString();
        return s;
      });

      replace("analysisTransition", {
        organisationId: org.id,
        reviewId: review.id,
        reportType: "diagnostic",
        cycleId,
      });
    },
  });

  screen.append(heading, subhead);

  const actions = document.createElement("div");
  actions.className = "screen-actions stack-tight";
  actions.append(confirmBtn, createButton({ label: "Back", variant: "secondary", onClick: () => back() }));
  screen.append(actions);
}

export function renderAssessmentComplete(container, params) {
  const state = getState();
  const { org, review } = findReview(state, params.organisationId, params.reviewId);

  const screen = document.createElement("div");
  screen.className = "screen stack";

  if (!org || !review) {
    const notFound = document.createElement("p");
    notFound.className = "text-body-secondary";
    notFound.textContent = "Review not found.";
    screen.append(notFound);
    container.append(screen);
    return;
  }

  if (params.completionStage === "diagnostic") {
    renderDiagnosticCompletion(screen, org, review, params.cycleId);
  } else {
    renderHealthReviewCompletion(screen, org, review);
  }

  container.append(screen);
}
