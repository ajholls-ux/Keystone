// ==========================================================================
// Decamark Field Kit — Organisation Detail View
//
// Entry point for starting a new Operational Health Review or resuming
// an existing one. Milestone 3.
// ==========================================================================

import { getState, updateState } from "../state/store.js";
import { createReview } from "../state/schema.js";
import { createButton } from "../components/button.js";
import { createCard } from "../components/card.js";
import { navigate, back } from "../router.js";

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function reviewStatusLabel(review) {
  const activeCycle = review.diagnosticCycles.find((c) => !c.locked);
  const lockedCycleCount = review.diagnosticCycles.filter((c) => c.locked).length;

  if (activeCycle) return `Diagnostic Cycle ${activeCycle.cycleNumber} in progress`;
  if (lockedCycleCount > 0) return `${lockedCycleCount} Diagnostic cycle${lockedCycleCount === 1 ? "" : "s"} completed`;

  const allComplete = review.pillarAssessments.every((p) => p.healthReviewStatus === "complete");
  if (allComplete) return "Operational Health Review complete";
  return "Operational Health Review in progress";
}

export function renderOrganisationDetail(container, params) {
  const state = getState();
  const org = state.organisations.find((o) => o.id === params.organisationId);

  const screen = document.createElement("div");
  screen.className = "screen stack";

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

  screen.append(heading, meta);

  const reviewsHeading = document.createElement("p");
  reviewsHeading.className = "text-heading-section";
  reviewsHeading.textContent = "Reviews";
  screen.append(reviewsHeading);

  if (org.reviews.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No reviews yet for this organisation.";
    screen.append(empty);
  } else {
    const list = document.createElement("div");
    list.className = "stack-tight";
    org.reviews
      .slice()
      .sort((a, b) => new Date(b.dateStarted) - new Date(a.dateStarted))
      .forEach((review) => {
        const card = createCard({
          onClick: () =>
            navigate("reviewOverview", { organisationId: org.id, reviewId: review.id }),
        });
        const title = document.createElement("span");
        title.className = "card__title";
        title.textContent = `Started ${formatDate(review.dateStarted)}`;
        const status = document.createElement("span");
        status.className = "card__meta";
        status.textContent = reviewStatusLabel(review);
        card.append(title, status);
        list.append(card);
      });
    screen.append(list);
  }

  const actions = document.createElement("div");
  actions.className = "screen-actions stack-tight";

  actions.append(
    createButton({
      label: "Start Operational Health Review",
      variant: "primary",
      onClick: () => {
        const review = createReview(org.id);
        updateState((s) => {
          const o = s.organisations.find((oo) => oo.id === org.id);
          o.reviews.push(review);
          return s;
        });
        navigate("reviewOverview", { organisationId: org.id, reviewId: review.id });
      },
    })
  );
  actions.append(createButton({ label: "Back", variant: "secondary", onClick: () => back() }));

  screen.append(actions);
  container.append(screen);
}
