// ==========================================================================
// Decamark Field Kit - Diagnostic Pillar Selection View
//
// Scope the paid Diagnostic cycle. Select 1-3 pillars for a standard cycle.
// 4+ is extended scope - warn the assessor. Cycle-level synthesis fields
// feed the paid Diagnostic report.
// ==========================================================================

import { getState, updateState } from "../state/store.js";
import {
  PILLARS,
  createCyclePillarEntry,
  normalizeDiagnosticCycle,
} from "../state/schema.js";
import { SCORE_LABELS } from "../components/scoreSelector.js";
import { createButton } from "../components/button.js";
import { createTextField } from "../components/textField.js";
import { back } from "../router.js";

function findCycle(state, organisationId, reviewId, cycleId) {
  const org = state.organisations.find((o) => o.id === organisationId);
  const review = org?.reviews.find((r) => r.id === reviewId);
  const cycle = review?.diagnosticCycles.find((c) => c.id === cycleId);
  return { org, review, cycle };
}

const STATUS_LABELS = {
  "selected-not-started": "Selected: not yet started",
  "in-progress": "Diagnostic in progress",
  complete: "Diagnostic complete",
};

export function renderDiagnosticPillarSelection(container, params) {
  const state = getState();
  const { org, review, cycle: rawCycle } = findCycle(
    state,
    params.organisationId,
    params.reviewId,
    params.cycleId
  );

  const screen = document.createElement("div");
  screen.className = "screen stack";

  if (!org || !review || !rawCycle) {
    const notFound = document.createElement("p");
    notFound.className = "text-body-secondary";
    notFound.textContent = "Diagnostic cycle not found.";
    screen.append(notFound);
    container.append(screen);
    return;
  }

  const cycle = normalizeDiagnosticCycle(rawCycle);
  const readOnly = cycle.locked;
  const selectedCount = Object.keys(cycle.pillars || {}).length;

  const heading = document.createElement("h1");
  heading.className = "text-heading-screen";
  heading.textContent = readOnly
    ? `Diagnostic Cycle ${cycle.cycleNumber} Scope`
    : `Manage Diagnostic Cycle ${cycle.cycleNumber} Scope`;

  const subhead = document.createElement("p");
  subhead.className = "text-body-secondary";
  subhead.textContent = readOnly
    ? "This Diagnostic cycle is complete. Scope is final."
    : "Select the pillars to investigate in this paid cycle. Standard scope is 1-3 pillars. Use Health Review scores as a guide - do not select everything by default.";

  screen.append(heading, subhead);

  if (!readOnly && selectedCount >= 4) {
    const warn = document.createElement("p");
    warn.className = "text-caption";
    warn.style.color = "#9A6B1F";
    warn.textContent = `You have ${selectedCount} pillars selected. That is extended scope. Confirm the fee matches the workload before you dig into all of them.`;
    screen.append(warn);
  }

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
      ? `Health Review score: ${pillar.maturityScore} - ${SCORE_LABELS[pillar.maturityScore]}`
      : "Health Review score: not recorded";

    const statusLine = document.createElement("span");
    statusLine.className = "card__meta";
    statusLine.textContent = cycleEntry
      ? STATUS_LABELS[cycleEntry.status] || cycleEntry.status
      : "Not selected for this cycle";

    row.append(name, scoreLine, statusLine);

    if (!readOnly) {
      const isSelected = Boolean(cycleEntry);
      const toggleBtn = createButton({
        label: isSelected ? "Selected: tap to remove" : "Select for this cycle",
        variant: isSelected ? "primary" : "secondary",
        onClick: () => {
          updateState((s) => {
            const { review: r, cycle: c } = findCycle(s, org.id, review.id, cycle.id);
            if (isSelected) {
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

  // Cycle-level synthesis (feeds paid report)
  const synthHead = document.createElement("h2");
  synthHead.className = "text-heading-section";
  synthHead.textContent = "Cycle synthesis (for the Diagnostic report)";

  const synthHint = document.createElement("p");
  synthHint.className = "text-caption";
  synthHint.textContent =
    "Fill these once you have worked the pillars. They appear in the paid Diagnostic report. Plain language for the owner. No auto-fill from Free - you write the synthesis.";

  screen.append(synthHead, synthHint);

  function saveCycleField(key, value) {
    updateState((s) => {
      const { review: r, cycle: c } = findCycle(s, org.id, review.id, cycle.id);
      c[key] = value;
      r.lastUpdatedAt = new Date().toISOString();
      return s;
    });
  }

  const fields = [
    {
      key: "connectedPicture",
      label: "Connected picture",
      placeholder:
        "e.g. Stock truth is weak, so the counter discounts under pressure. Leadership priorities differ by role, so neither issue fully closes.",
    },
    {
      key: "priorityAcrossCycle",
      label: "Priority across this cycle",
      placeholder:
        "e.g. 1) One shared weekly priority and huddle. 2) Stock truth checks. 3) Simple discount bands.",
    },
    {
      key: "successLooksLike",
      label: "What better looks like in 4-6 weeks",
      placeholder:
        "e.g. Counter and yard name the same priority. Core-line misses are falling. Overrides have a reason logged.",
    },
    {
      key: "outOfScopeNotes",
      label: "Out of scope this cycle",
      placeholder:
        "e.g. Full process redesign, new WMS, Safety deep-dive, and implementation programme management.",
    },
  ];

  fields.forEach(({ key, label, placeholder }) => {
    const f = createTextField({
      id: "cycle-" + key,
      label,
      textarea: true,
    });
    f.input.value = cycle[key] || "";
    f.input.placeholder = placeholder;
    f.input.disabled = readOnly;
    f.input.addEventListener("blur", () => {
      if (!readOnly) saveCycleField(key, f.input.value);
    });
    screen.append(f.element);
  });

  const actions = document.createElement("div");
  actions.className = "screen-actions";
  actions.append(
    createButton({
      label: "Back to Review Overview",
      variant: "secondary",
      onClick: () => back(),
    })
  );
  screen.append(actions);

  container.append(screen);
}
