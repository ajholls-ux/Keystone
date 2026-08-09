// ==========================================================================
// Keystone Field Kit — Diagnostic Pillar Selection View
//
// Screen 7 of the locked Screen Map (Part 2 v1.0). Operates on one
// specific Diagnostic Cycle (params.cycleId). Selection is scoped to that
// cycle only — a pillar not selected here remains fully available to a
// future cycle; nothing here is a permanent flag on the pillar itself.
// Read-only once this specific cycle is locked.
// ==========================================================================

import { getState, updateState } from "../state/store.js";
import { PILLARS, createCyclePillarEntry } from "../state/schema.js";
import { SCORE_LABELS } from "../components/scoreSelector.js";
import { createButton } from "../components/button.js";
import { back } from "../router.js";

function findCycle(state, organisationId, reviewId, cycleId) {
  const org = state.organisations.find((o) => o.id === organisationId);
  const review = org?.reviews.find((r) => r.id === reviewId);
  const cycle = review?.diagnosticCycles.find((c) => c.id === cycleId);
  return { org, review, cycle };
}

const STATUS_LABELS = {
  "selected-not-started": "Selected — not yet started",
  "in-progress": "Diagnostic in progress",
  "complete": "Diagnostic complete",
};

export function renderDiagnosticPillarSelection(container, params) {
  const state = getState();
  const { org, review, cycle } = findCycle(state, params.organisationId, params.reviewId, params.cycleId);

  const screen = document.createElement("div");
  screen.className = "screen stack";

  if (!org || !review || !cycle) {
    const notFound = document.createElement("p");
    notFound.className = "text-body-secondary";
    notFound.textContent = "Diagnostic cycle not found.";
    screen.append(notFound);
    container.append(screen);
    return;
  }

  const readOnly = cycle.locked;

  const heading = document.createElement("h1");
  heading.className = "text-heading-screen";
  heading.textContent = readOnly
    ? `Diagnostic Cycle ${cycle.cycleNumber} Scope`
    : `Manage Diagnostic Cycle ${cycle.cycleNumber} Scope`;

  const subhead = document.createElement("p");
  subhead.className = "text-body-secondary";
  subhead.textContent = readOnly
    ? "This Diagnostic cycle is complete. Scope is final."
    : "Select which pillars matter most to investigate in this cycle, based on the Health Review outcome below. Pillars not selected remain fully available for a future cycle.";

  screen.append(heading, subhead);

  const list = document.createElement("div");
  list.className = "stack-tight";

  review.pillarAssessments.forEach((pillar) => {
    const pillarMeta = PILLARS.find((p) => p.key === pillar.pillarKey);
    const cycleEntry = cycle.pillars[pillar.pillarKey];

    const row = document.createElement("div");
    row.className = "card";

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
    statusLine.textContent = cycleEntry ? STATUS_LABELS[cycleEntry.status] : "Not selected for this cycle";

    row.append(name, scoreLine, statusLine);

    if (!readOnly) {
      const isSelected = Boolean(cycleEntry);
      const toggleBtn = createButton({
        label: isSelected ? "Selected — tap to remove" : "Select for this cycle",
        variant: isSelected ? "primary" : "secondary",
        onClick: () => {
          updateState((s) => {
            const { review: r, cycle: c } = findCycle(s, org.id, review.id, cycle.id);
            if (isSelected) {
              // Only allow removal if no Diagnostic work has begun on it yet.
              if (c.pillars[pillar.pillarKey].status === "selected-not-started") {
                delete c.pillars[pillar.pillarKey];
              }
            } else {
              c.pillars[pillar.pillarKey] = createCyclePillarEntry();
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
