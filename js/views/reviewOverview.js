// ==========================================================================
// Keystone Field Kit -- Review Overview View
//
// Screen 5 of the locked Screen Map (Part 2 v1.0). The assessor's command
// centre. Governed by Assessment Engine v1.0 plus the Diagnostic Cycles
// architectural clarification: the Review supports an ongoing improvement
// journey -- one Health Review baseline, followed by zero or more
// Diagnostic Cycles over time. Only individual completed cycles lock;
// the Review and organisation are never permanently closed off.
// ==========================================================================

import { getState, updateState } from "../state/store.js";
import { PILLARS, createDiagnosticCycle } from "../state/schema.js";
import { createButton } from "../components/button.js";
import { createStatusMarker } from "../components/statusMarker.js";
import { navigate, back } from "../router.js";

function findOrgAndReview(state, organisationId, reviewId) {
  const org = state.organisations.find((o) => o.id === organisationId);
  const review = org?.reviews.find((r) => r.id === reviewId);
  return { org, review };
}

function formatDate(iso) {
  if (!iso) return "--";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function findActiveCycle(review) {
  return review.diagnosticCycles.find((c) => !c.locked) || null;
}

function renderSummaryCard(org, review, activeCycle) {
  const card = document.createElement("div");
  card.className = "summary-card";

  const completedCount = review.pillarAssessments.filter(
    (p) => p.healthReviewStatus === "complete"
  ).length;

  const scored = review.pillarAssessments.filter((p) => p.maturityScore != null);
  const avgMaturity = scored.length
    ? (scored.reduce((sum, p) => sum + p.maturityScore, 0) / scored.length).toFixed(1)
    : "--";

  const lockedCycleCount = review.diagnosticCycles.filter((c) => c.locked).length;

  const rows = [
    ["Organisation", org.businessName],
    ["Health Review progress", `${completedCount} / 10 pillars complete`],
    ["Health Review maturity", avgMaturity === "--" ? "--" : `${avgMaturity} / 4`],
    [
      "Diagnostic history",
      lockedCycleCount === 0 ? "No completed cycles yet" : `${lockedCycleCount} completed cycle${lockedCycleCount === 1 ? "" : "s"}`,
    ],
    ["Currently active", activeCycle ? `Diagnostic Cycle ${activeCycle.cycleNumber}` : "None"],
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

function renderPillarRow(pillarKey, status, onClick) {
  const row = document.createElement("button");
  row.type = "button";
  row.className = "card pillar-row";
  row.addEventListener("click", onClick);

  const name = document.createElement("span");
  name.className = "pillar-row__name";
  name.textContent = PILLARS.find((p) => p.key === pillarKey).name;

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

  const activeCycle = findActiveCycle(review);

  const heading = document.createElement("h1");
  heading.className = "text-heading-screen";
  heading.textContent = "Review Overview";

  screen.append(heading, renderSummaryCard(org, review, activeCycle));

  function goToHealthReviewPillar(pillarKey) {
    navigate("pillarAssessment", { organisationId: org.id, reviewId: review.id, pillarKey });
  }

  function goToDiagnosticPillar(pillarKey) {
    navigate("pillarAssessment", {
      organisationId: org.id,
      reviewId: review.id,
      pillarKey,
      cycleId: activeCycle.id,
    });
  }

  // Health Review baseline -- always visible, always the permanent record.
  const hrHeading = document.createElement("p");
  hrHeading.className = "pillar-group-title";
  hrHeading.textContent = "Operational Health Review";
  screen.append(hrHeading);

  const hrList = document.createElement("div");
  hrList.className = "stack-tight";
  review.pillarAssessments.forEach((pillar) => {
    hrList.append(
      renderPillarRow(pillar.pillarKey, pillar.healthReviewStatus, () =>
        goToHealthReviewPillar(pillar.pillarKey)
      )
    );
  });
  screen.append(hrList);

  // Active Diagnostic Cycle -- pillar groupings scoped to this cycle only.
  if (activeCycle) {
    const cycleHeading = document.createElement("p");
    cycleHeading.className = "pillar-group-title";
    cycleHeading.textContent = `Diagnostic Cycle ${activeCycle.cycleNumber}`;
    screen.append(cycleHeading);

    const cycleList = document.createElement("div");
    cycleList.className = "stack-tight";

    const selectedKeys = Object.keys(activeCycle.pillars);
    selectedKeys.forEach((pillarKey) => {
      cycleList.append(
        renderPillarRow(pillarKey, activeCycle.pillars[pillarKey].status, () =>
          goToDiagnosticPillar(pillarKey)
        )
      );
    });

    if (selectedKeys.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No pillars selected for this cycle yet.";
      cycleList.append(empty);
    }

    screen.append(cycleList);
  }

  // Historical, locked Diagnostic Cycles -- permanent records.
  const lockedCycles = review.diagnosticCycles.filter((c) => c.locked);
  if (lockedCycles.length > 0) {
    const historyHeading = document.createElement("p");
    historyHeading.className = "pillar-group-title";
    historyHeading.textContent = "Diagnostic History";
    screen.append(historyHeading);

    const historyList = document.createElement("div");
    historyList.className = "stack-tight";
    lockedCycles.forEach((cycle) => {
      const row = document.createElement("div");
      row.className = "card";
      const title = document.createElement("span");
      title.className = "card__title";
      title.textContent = `Diagnostic Cycle ${cycle.cycleNumber}`;
      const meta = document.createElement("span");
      meta.className = "card__meta";
      meta.textContent = `Completed ${formatDate(cycle.completedAt)}`;
      const footer = document.createElement("div");
      footer.className = "card__footer";
      footer.append(
        createButton({
          label: "View Diagnostic Report",
          variant: "secondary",
          onClick: () =>
            navigate("assessmentReport", {
              organisationId: org.id,
              reviewId: review.id,
              reportType: "diagnostic",
              cycleId: cycle.id,
            }),
        })
      );
      row.append(title, meta, footer);
      historyList.append(row);
    });
    screen.append(historyList);
  }

  // Actions
  const allHealthReviewComplete = review.pillarAssessments.every(
    (p) => p.healthReviewStatus === "complete"
  );

  const activeCycleSelectedKeys = activeCycle ? Object.keys(activeCycle.pillars) : [];
  const allActiveCyclePillarsComplete =
    activeCycle &&
    activeCycleSelectedKeys.length > 0 &&
    activeCycleSelectedKeys.every((key) => activeCycle.pillars[key].status === "complete");

  const actions = document.createElement("div");
  actions.className = "screen-actions stack-tight";

  if (allHealthReviewComplete && !review.clientReportGeneratedAt) {
    actions.append(
      createButton({
        label: "Complete Health Review",
        variant: "primary",
        onClick: () => navigate("assessmentComplete", { organisationId: org.id, reviewId: review.id }),
      })
    );
  }

  if (review.clientReportGeneratedAt) {
    actions.append(
      createButton({
        label: "View Health Review Report",
        variant: "secondary",
        onClick: () =>
          navigate("assessmentReport", {
            organisationId: org.id,
            reviewId: review.id,
            reportType: "client",
          }),
      })
    );
  }

  // A new Diagnostic Cycle can start once the Client Report exists and no
  // cycle is currently active -- this deliberately does not auto-select
  // pillars by score; the assessor chooses what matters most to
  // investigate next (Assessment Engine principle: investigate only what
  // creates meaningful operational value).
  if (review.clientReportGeneratedAt && !activeCycle) {
    const nextCycleNumber = review.diagnosticCycles.length + 1;
    actions.append(
      createButton({
        label:
          nextCycleNumber === 1
            ? "Start Operational Diagnostic"
            : `Start Diagnostic Cycle ${nextCycleNumber}`,
        variant: "primary",
        onClick: () => {
          const newCycle = createDiagnosticCycle(nextCycleNumber);
          updateState((s) => {
            const { review: r } = findOrgAndReview(s, org.id, review.id);
            r.diagnosticCycles.push(newCycle);
            r.lastUpdatedAt = new Date().toISOString();
            return s;
          });
          navigate("diagnosticPillarSelection", {
            organisationId: org.id,
            reviewId: review.id,
            cycleId: newCycle.id,
          });
        },
      })
    );
  }

  if (activeCycle) {
    actions.append(
      createButton({
        label: "Manage Diagnostic Scope",
        variant: "secondary",
        onClick: () =>
          navigate("diagnosticPillarSelection", {
            organisationId: org.id,
            reviewId: review.id,
            cycleId: activeCycle.id,
          }),
      })
    );

    if (allActiveCyclePillarsComplete) {
      actions.append(
        createButton({
          label: `Complete Diagnostic Cycle ${activeCycle.cycleNumber}`,
          variant: "primary",
          onClick: () =>
            navigate("assessmentComplete", {
              organisationId: org.id,
              reviewId: review.id,
              completionStage: "diagnostic",
              cycleId: activeCycle.id,
            }),
        })
      );
    }
  }

  actions.append(createButton({ label: "Back", variant: "secondary", onClick: () => back() }));

  screen.append(actions);
  container.append(screen);
}
