// ==========================================================================
// Keystone Field Kit — Organisation Detail View (STUB)
//
// Milestone 2 stub — proves list-to-detail navigation. Full Review
// Overview (ten-pillar progress map, starting a review) is Milestone 3.
// ==========================================================================

import { getState } from "../state/store.js";
import { createButton } from "../components/button.js";
import { back } from "../router.js";

export function renderOrganisationDetail(container, params) {
  const screen = document.createElement("div");
  screen.className = "screen stack";

  const state = getState();
  const org = state.organisations.find((o) => o.id === params.organisationId);

  if (!org) {
    const notFound = document.createElement("p");
    notFound.className = "text-body-secondary";
    notFound.textContent = "Organisation not found.";
    screen.append(notFound);
    container.append(screen);
    return;
  }

  const heading = document.createElement("h1");
  heading.className = "text-heading-screen";
  heading.textContent = org.businessName;

  const meta = document.createElement("p");
  meta.className = "text-body-secondary";
  meta.textContent = [org.siteLocation, org.industryType].filter(Boolean).join(" · ") || "—";

  const note = document.createElement("p");
  note.className = "text-body-secondary";
  note.textContent = "Review Overview arrives in Milestone 3.";

  const actions = document.createElement("div");
  actions.className = "screen-actions";
  actions.append(createButton({ label: "Back", variant: "secondary", onClick: () => back() }));

  screen.append(heading, meta, note, actions);
  container.append(screen);
}
