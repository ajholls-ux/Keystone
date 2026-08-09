// ==========================================================================
// Keystone Field Kit — Organisation List View
//
// Screen 3 of the locked Screen Map (Part 2). The assessor's home screen —
// the only true hub in the MVP.
// ==========================================================================

import { getState, exportBackup, importBackup } from "../state/store.js";
import { createButton } from "../components/button.js";
import { createCard } from "../components/card.js";
import { createStatusMarker } from "../components/statusMarker.js";
import { navigate, replace } from "../router.js";

/** Derives an organisation's overall status from its reviews. */
function deriveOrgStatus(org) {
  if (!org.reviews || org.reviews.length === 0) return "not-started";
  // Organisations are never permanently "finished" under the Diagnostic
  // Cycles model — this marker reflects whether at least one Health
  // Review baseline (Client Report) has been established, not whether
  // all possible future work is done.
  const anyClientReportGenerated = org.reviews.some((r) => r.clientReportGeneratedAt);
  return anyClientReportGenerated ? "complete" : "in-progress";
}

function renderOrgCard(org) {
  const card = createCard({
    onClick: () => navigate("organisationDetail", { organisationId: org.id }),
  });

  const title = document.createElement("span");
  title.className = "card__title";
  title.textContent = org.businessName;

  const meta = document.createElement("span");
  meta.className = "card__meta";
  meta.textContent = org.siteLocation || "No location recorded";

  const footer = document.createElement("div");
  footer.className = "card__footer";
  footer.append(createStatusMarker(deriveOrgStatus(org)));

  card.append(title, meta, footer);
  return card;
}

function renderEmptyState() {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = "No organisations yet. Add one to begin your first review.";
  return empty;
}

function renderBackupSection(container) {
  const section = document.createElement("div");
  section.className = "stack-tight";

  const heading = document.createElement("p");
  heading.className = "text-caption";
  heading.textContent = "Backup";

  const row = document.createElement("div");
  row.className = "action-row";

  const exportBtn = createButton({
    label: "Export backup",
    variant: "secondary",
    onClick: () => exportBackup(),
  });

  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.accept = "application/json";
  importInput.style.display = "none";

  const importBtn = createButton({
    label: "Restore backup",
    variant: "secondary",
    onClick: () => importInput.click(),
  });

  importInput.addEventListener("change", async () => {
    const file = importInput.files[0];
    if (!file) return;
    const confirmed = window.confirm(
      "Restoring a backup replaces all organisations and reviews currently on this device. This cannot be undone. Continue?"
    );
    if (!confirmed) {
      importInput.value = "";
      return;
    }
    try {
      await importBackup(file);
      replace("organisationList");
    } catch (err) {
      window.alert("This file could not be read as a Keystone backup.");
      console.error(err);
    } finally {
      importInput.value = "";
    }
  });

  row.append(exportBtn, importBtn);
  section.append(heading, row, importInput);
  container.append(section);
}

export function renderOrganisationList(container) {
  const screen = document.createElement("div");
  screen.className = "screen stack";

  const heading = document.createElement("h1");
  heading.className = "text-heading-screen";
  heading.textContent = "Organisations";

  const state = getState();
  const list = document.createElement("div");
  list.className = "stack";

  if (state.organisations.length === 0) {
    list.append(renderEmptyState());
  } else {
    state.organisations
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .forEach((org) => list.append(renderOrgCard(org)));
  }

  const actions = document.createElement("div");
  actions.className = "screen-actions";
  actions.append(
    createButton({
      label: "New organisation",
      variant: "primary",
      onClick: () => navigate("newOrganisation"),
    })
  );

  screen.append(heading, list, actions);
  renderBackupSection(screen);
  container.append(screen);
}
