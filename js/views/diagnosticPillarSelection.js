// ==========================================================================
// Keystone Field Kit — Diagnostic Pillar Selection View
//
// Screen 7 of the locked Screen Map (Part 2 v1.0). Single screen, two
// entry points (initial scope-setting, and repeat visits via "Manage
// Diagnostic Scope"). Read-only once diagnosticLocked.
// ==========================================================================

import { getState, updateState } from "../state/store.js";
import { PILLARS } from "../state/schema.js";
import { SCORE_LABELS } from "../components/scoreSelector.js";
import { createButton } from "../components/button.js";
import { back } from "../router.js";

function findReview(state, organisationId, reviewId) {
  const org = state.organisations.find((o) => o.id === organisationId);
  const review = org?.reviews.find((r) => r.id === reviewId);
  return { org, review };
}

export function renderDiagnosticPillarSelection(container, params) {
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

  const readOnly = review.diagnosticLocked;

  const heading = document.createElement("h1");
  heading.className = "text-heading-screen";
  heading.textContent = readOnly ? "Diagnostic Scope" : "Manage Diagnostic Scope";

  const subhead = document.createElement("p");
  subhead.className = "text-body-secondary";
  subhead.textContent = readOnly
    ? "This Operational Diagnostic is complete. Scope is final."
    : "Select which pillars require deeper investigation, based on the Health Review outcome below.";

  screen.append(heading, subhead);

  const list = document.createElement("div");
  list.className = "stack-tight";

  review.pillarAssessments.forEach((pillar) => {
    const pillarMeta = PILLARS.find((p) => p.key === pillar.pillarKey);
    const row = document.createElement("div");
    row.className = "card";
    row.style.cursor = readOnly ? "default" : "pointer";

    const name = document.createElement("span");
    name.className = "card__title";
    name.textContent = pillarMeta.name;

    const scoreLine = document.createElement("span");
    scoreLine.className = "card__meta";
    scoreLine.textContent = pillar.maturityScore
      ? `Health Review score: ${pillar.maturityScore} — ${SCORE_LABELS[pillar.maturityScore]}`
      : "Health Review score: not recorded";

    const statusLine = document.createElement("span");
    statusLine.className = "card__meta";
    const statusLabels = {
      "not-selected": "Not selected for Diagnostic",
      "selected-not-started": "Selected — not yet started",
      "in-progress": "Diagnostic in progress",
      "complete": "Diagnostic complete",
    };
    statusLine.textContent = statusLabels[pillar.diagnosticStatus];

    row.append(name, scoreLine, statusLine);

    if (!readOnly) {
      const isSelected = pillar.diagnosticStatus !== "not-selected";
      const toggleBtn = createButton({
        label: isSelected ? "Selected — tap to remove" : "Select for Diagnostic",
        variant: isSelected ? "primary" : "secondary",
        onClick: () => {
          updateState((s) => {
            const { review: r } = findReview(s, org.id, review.id);
            const p = r.pillarAssessments.find((pp) => pp.pillarKey === pillar.pillarKey);
            if (isSelected) {
              // Only allow removal if no Diagnostic work has begun on it yet.
              if (p.diagnosticStatus === "selected-not-started") {
                p.diagnosticStatus = "not-selected";
              }
            } else {
              p.diagnosticStatus = "selected-not-started";
            }
            r.lastUpdatedAt = new Date().toISOString();
            return s;
          });
          container.innerHTML = "";
          renderDiagnosticPillarSelection(container, params);
        },
      });
      const footer = document.createElement("div");
      footer.className = "card__footer";
      footer.append(toggleBtn);
      row.append(footer);
    }

    list.append(row);
  });

  screen.append(list);

  const actions = document.createElement("div");
  actions.className = "screen-actions";
  actions.append(createButton({ label: "Back to Review Overview", variant: "secondary", onClick: () => back() }));
  screen.append(actions);

  container.append(screen);
}
