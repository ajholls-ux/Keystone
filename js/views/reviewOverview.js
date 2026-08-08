// ==========================================================================
// Keystone Field Kit — Review Overview View
//
// Screen 5 of the locked Screen Map (Part 2 v1.0). The assessor's command
// centre. Governed by Assessment Engine v1.0.
// ==========================================================================

import { getState, updateState } from "../state/store.js";
import { PILLARS } from "../state/schema.js";
import { createButton } from "../components/button.js";
import { createStatusMarker } from "../components/statusMarker.js";
import { navigate, back } from "../router.js";

function findOrgAndReview(state, organisationId, reviewId) {
  const org = state.organisations.find((o) => o.id === organisationId);
  const review = org?.reviews.find((r) => r.id === reviewId);
  return { org, review };
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function pillarStatusForCurrentStage(pillar, review) {
  return review.stage === "diagnostic" ? pillar.diagnosticStatus : pillar.healthReviewStatus;
}

function renderSummaryCard(org, review) {
  const card = document.createElement("div");
  card.className = "summary-card";

  const completedCount = review.pillarAssessments.filter(
    (p) => p.healthReviewStatus === "complete"
  ).length;

  const scored = review.pillarAssessments.filter((p) => p.maturityScore != null);
  const avgMaturity = scored.length
    ? (scored.reduce((sum, p) => sum + p.maturityScore, 0) / scored.length).toFixed(1)
    : "—";

  const rows = [
    ["Organisation", org.businessName],
    [
      "Assessment type",
      review.stage === "diagnostic" ? "Operational Diagnostic" : "Operational Health Review",
    ],
    ["Current stage", review.stage === "diagnostic" ? "Diagnostic" : "Health Review"],
    ["Progress", `${completedCount} / 10 pillars complete`],
    ["Operational maturity", avgMaturity === "—" ? "—" : `${avgMaturity} / 4`],
    ["Started", formatDate(review.dateStarted)],
    ["Last updated", formatDate(review.lastUpdatedAt)],
  ];

  const dl = document.createElement("dl");
  dl.style.margin = "0";
  rows.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "summary-card__row";
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    row.append(dt, dd);
    dl.append(row);
  });

  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar";
  progressBar.style.marginTop = "var(--space-2)";
  const fill = document.createElement("div");
  fill.className = "progress-bar__fill";
  fill.style.width = `${(completedCount / 10) * 100}%`;
  progressBar.append(fill);

  card.append(dl, progressBar);
  return card;
}

function renderPillarRow(pillar, status, onClick) {
  const row = document.createElement("button");
  row.type = "button";
  row.className = "card pillar-row";
  row.addEventListener("click", onClick);

  const name = document.createElement("span");
  name.className = "pillar-row__name";
  name.textContent = PILLARS.find((p) => p.key === pillar.pillarKey).name;

  row.append(name, createStatusMarker(status));
  return row;
}

export function renderReviewOverview(container, params) {
  const state = getState();
  const { org, review } = findOrgAndReview(state, params.organisationId, params.reviewId);

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

  const heading = document.createElement("h1");
  heading.className = "text-heading-screen";
  heading.textContent = "Review Overview";

  screen.append(heading, renderSummaryCard(org, review));

  const pillarList = document.createElement("div");
  pillarList.className = "stack-tight";

  function goToPillar(pillarKey) {
    navigate("pillarAssessment", {
      organisationId: org.id,
      reviewId: review.id,
      pillarKey,
    });
  }

  if (review.stage !== "diagnostic") {
    // Flat list — Health Review stage only.
    review.pillarAssessments.forEach((pillar) => {
      pillarList.append(
        renderPillarRow(pillar, pillar.healthReviewStatus, () => goToPillar(pillar.pillarKey))
      );
    });
  } else {
    // Grouped view once Diagnostic has unlocked.
    const groups = [
      {
        title: "Selected for Diagnostic",
        filter: (p) => p.diagnosticStatus === "selected-not-started" || p.diagnosticStatus === "in-progress",
      },
      {
        title: "Available for Diagnostic",
        filter: (p) => p.diagnosticStatus === "not-selected",
      },
      {
        title: "Completed",
        filter: (p) => p.diagnosticStatus === "complete",
      },
    ];

    groups.forEach(({ title, filter }) => {
      const matches = review.pillarAssessments.filter(filter);
      if (matches.length === 0) return;
      const groupTitle = document.createElement("p");
      groupTitle.className = "pillar-group-title";
      groupTitle.textContent = title;
      pillarList.append(groupTitle);
      matches.forEach((pillar) => {
        pillarList.append(
          renderPillarRow(pillar, pillarStatusForCurrentStage(pillar, review), () =>
            goToPillar(pillar.pillarKey)
          )
        );
      });
    });
  }

  screen.append(pillarList);

  // Diagnostic stage actions
  const allHealthReviewComplete = review.pillarAssessments.every(
    (p) => p.healthReviewStatus === "complete"
  );

  const selectedDiagnosticPillars = review.pillarAssessments.filter(
    (p) => p.diagnosticStatus !== "not-selected"
  );
  const allSelectedDiagnosticComplete =
    selectedDiagnosticPillars.length > 0 &&
    selectedDiagnosticPillars.every((p) => p.diagnosticStatus === "complete");

  const actions = document.createElement("div");
  actions.className = "screen-actions stack-tight";

  // Health Review stage: must complete the Client Report before Diagnostic
  // can ever start (Milestone 3.5 fix — Assessment Engine's lifecycle
  // requires this; it was not correctly enforced in Milestone 3).
  if (review.stage !== "diagnostic") {
    if (allHealthReviewComplete && !review.clientReportGeneratedAt) {
      actions.append(
        createButton({
          label: "Complete Health Review",
          variant: "primary",
          onClick: () =>
            navigate("assessmentComplete", { organisationId: org.id, reviewId: review.id }),
        })
      );
    }

    if (review.clientReportGeneratedAt) {
      actions.append(
        createButton({
          label: "View Client Report",
          variant: "secondary",
          onClick: () =>
            navigate("assessmentReport", {
              organisationId: org.id,
              reviewId: review.id,
              reportType: "client",
            }),
        })
      );
      actions.append(
        createButton({
          label: "Start Operational Diagnostic",
          variant: "primary",
          onClick: () => {
            updateState((s) => {
              const { review: r } = findOrgAndReview(s, org.id, review.id);
              r.stage = "diagnostic";
              r.diagnosticUnlocked = true;
              r.lastUpdatedAt = new Date().toISOString();
              return s;
            });
            navigate("diagnosticPillarSelection", { organisationId: org.id, reviewId: review.id });
          },
        })
      );
    }
  }

  if (review.stage === "diagnostic") {
    actions.append(
      createButton({
        label: review.diagnosticLocked ? "View Diagnostic Scope" : "Manage Diagnostic Scope",
        variant: "secondary",
        onClick: () =>
          navigate("diagnosticPillarSelection", { organisationId: org.id, reviewId: review.id }),
      })
    );

    if (review.diagnosticLocked) {
      actions.append(
        createButton({
          label: "View Diagnostic Report",
          variant: "primary",
          onClick: () =>
            navigate("assessmentReport", {
              organisationId: org.id,
              reviewId: review.id,
              reportType: "diagnostic",
            }),
        })
      );
    } else if (allSelectedDiagnosticComplete) {
      actions.append(
        createButton({
          label: "Complete Operational Diagnostic",
          variant: "primary",
          onClick: () =>
            navigate("assessmentComplete", {
              organisationId: org.id,
              reviewId: review.id,
              completionStage: "diagnostic",
            }),
        })
      );
    }
  }

  actions.append(createButton({ label: "Back", variant: "secondary", onClick: () => back() }));

  screen.append(actions);
  container.append(screen);
}
