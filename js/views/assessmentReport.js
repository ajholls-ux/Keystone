// ==========================================================================
// Keystone Field Kit — Assessment Report View
//
// Screen 10 of the locked Screen Map. Two distinct outputs sharing this
// screen: Client Report (free) and Diagnostic Report (paid, superset).
// Content strictly filtered per Assessment Engine v1.0 §Internal vs
// Client Behaviour — internal-only fields never render here.
// ==========================================================================

import { getState } from "../state/store.js";
import { PILLARS, calculateHealthIndicator } from "../state/schema.js";
import { createButton } from "../components/button.js";
import { back } from "../router.js";

function findReview(state, organisationId, reviewId) {
  const org = state.organisations.find((o) => o.id === organisationId);
  const review = org?.reviews.find((r) => r.id === reviewId);
  return { org, review };
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

const RECOMMENDATION_COPY = {
  "not-recommended": {
    heading: "No Operational Diagnostic Currently Recommended",
    body:
      "This review demonstrated consistently mature operational performance. No further Diagnostic investigation is currently recommended. An Operational Diagnostic remains available at any time for organisations wishing to optimise already strong operations, rather than solve problems.",
  },
  recommended: {
    heading: "Operational Diagnostic Recommended",
    body:
      "This review identified operational opportunities that would benefit from deeper investigation. We recommend consideration of an Operational Diagnostic to understand root causes, risk, and a practical path forward.",
  },
  optional: {
    heading: "Operational Diagnostic Optional",
    body:
      "This review identified areas that could benefit from further investigation, though this is not essential. An Operational Diagnostic is available should you wish to explore these opportunities in more depth.",
  },
};

function section(titleText) {
  const wrap = document.createElement("div");
  wrap.className = "report-section";
  const h = document.createElement("h2");
  h.className = "text-heading-section";
  h.textContent = titleText;
  wrap.append(h);
  return wrap;
}

function renderCoverPage(org, review, reportType) {
  const cover = document.createElement("div");
  cover.className = "report-cover stack-loose";

  const title = document.createElement("h1");
  title.className = "text-display";
  title.textContent = reportType === "diagnostic" ? "Operational Diagnostic Report" : "Operational Health Review";

  const orgName = document.createElement("p");
  orgName.className = "text-heading-section";
  orgName.textContent = org.businessName;

  const meta = document.createElement("p");
  meta.className = "text-body-secondary";
  meta.textContent = `Prepared by ${org.assessorName || "Keystone Assessor"} · ${formatDate(
    reportType === "diagnostic" ? review.diagnosticReportGeneratedAt : review.clientReportGeneratedAt
  )}`;

  cover.append(title, orgName, meta);
  return cover;
}

function renderValueStatement() {
  const wrap = section("");
  wrap.querySelector("h2").remove();
  const p = document.createElement("p");
  p.className = "text-body-secondary";
  p.textContent =
    "This review reflects a structured, evidence-led assessment of your operation. Every observation, strength, and opportunity identified here is grounded in what was directly observed, discussed, and evidenced on site.";
  wrap.append(p);
  return wrap;
}

function renderExecutiveSummary(review) {
  const wrap = section("Executive Summary");
  const indicator = calculateHealthIndicator(review.pillarAssessments);

  const indicatorRow = document.createElement("p");
  indicatorRow.className = "health-indicator";
  indicatorRow.innerHTML = `<span class="health-indicator__emoji">${indicator.emoji}</span><span>${indicator.label}</span>`;

  const strengthsCount = review.pillarAssessments.reduce((n, p) => n + p.strengths.length, 0);
  const opportunitiesCount = review.pillarAssessments.reduce((n, p) => n + p.opportunities.length, 0);

  const summary = document.createElement("p");
  summary.className = "text-body-secondary";
  summary.textContent = `This review identified ${strengthsCount} operational strength${
    strengthsCount === 1 ? "" : "s"
  } and ${opportunitiesCount} opportunit${opportunitiesCount === 1 ? "y" : "ies"} for further consideration across all ten operational pillars.`;

  wrap.append(indicatorRow, summary);
  return wrap;
}

function renderStrengthsAndOpportunities(review) {
  const wrap = section("Strengths & Opportunities");

  review.pillarAssessments.forEach((pillar) => {
    if (pillar.strengths.length === 0 && pillar.opportunities.length === 0) return;
    const pillarMeta = PILLARS.find((p) => p.key === pillar.pillarKey);

    const pillarHeading = document.createElement("p");
    pillarHeading.style.fontWeight = "600";
    pillarHeading.style.marginTop = "var(--space-2)";
    pillarHeading.textContent = pillarMeta.name;
    wrap.append(pillarHeading);

    if (pillar.strengths.length > 0) {
      const ul = document.createElement("ul");
      ul.style.margin = "4px 0";
      pillar.strengths.forEach((s) => {
        const li = document.createElement("li");
        li.className = "text-body-secondary";
        li.textContent = s;
        ul.append(li);
      });
      wrap.append(ul);
    }

    if (pillar.opportunities.length > 0) {
      const ul = document.createElement("ul");
      ul.style.margin = "4px 0";
      pillar.opportunities.forEach((o) => {
        const li = document.createElement("li");
        li.className = "text-body-secondary";
        li.textContent = o;
        ul.append(li);
      });
      wrap.append(ul);
    }

    if (pillar.professionalObservation) {
      const obs = document.createElement("p");
      obs.className = "text-body-secondary";
      obs.style.fontStyle = "italic";
      obs.textContent = pillar.professionalObservation;
      wrap.append(obs);
    }
  });

  return wrap;
}

function renderRecommendationSection(review) {
  const copy = RECOMMENDATION_COPY[review.diagnosticRecommendation];
  if (!copy) return document.createDocumentFragment();

  const wrap = section(copy.heading);
  wrap.querySelector("h2").remove();
  const headingEl = document.createElement("p");
  headingEl.className = "text-heading-section";
  headingEl.textContent = copy.heading;
  const body = document.createElement("p");
  body.className = "text-body-secondary";
  body.textContent = copy.body;
  wrap.prepend(body);
  wrap.prepend(headingEl);
  return wrap;
}

function renderDiagnosticSections(review) {
  const selectedPillars = review.pillarAssessments.filter((p) => p.diagnosticStatus === "complete");
  if (selectedPillars.length === 0) return document.createDocumentFragment();

  const frag = document.createDocumentFragment();

  selectedPillars.forEach((pillar) => {
    const pillarMeta = PILLARS.find((p) => p.key === pillar.pillarKey);
    const wrap = section(pillarMeta.name);

    const fields = [
      ["Root Cause Analysis", pillar.rootCauseAnalysis],
      ["Operational Risk", pillar.operationalRisk],
      ["Cost of Inaction", pillar.costOfInaction],
    ];
    fields.forEach(([label, value]) => {
      if (!value) return;
      const l = document.createElement("p");
      l.style.fontWeight = "600";
      l.textContent = label;
      const v = document.createElement("p");
      v.className = "text-body-secondary";
      v.textContent = value;
      wrap.append(l, v);
    });

    if (pillar.recommendations.length > 0) {
      const l = document.createElement("p");
      l.style.fontWeight = "600";
      l.textContent = "Recommendations";
      wrap.append(l);
      const ul = document.createElement("ul");
      pillar.recommendations.forEach((r) => {
        const li = document.createElement("li");
        li.className = "text-body-secondary";
        li.textContent = r.text;
        ul.append(li);
      });
      wrap.append(ul);
    }

    if (pillar.implementationPlan.length > 0) {
      const l = document.createElement("p");
      l.style.fontWeight = "600";
      l.textContent = "Implementation Plan";
      wrap.append(l);
      const ul = document.createElement("ul");
      pillar.implementationPlan.forEach((step) => {
        const li = document.createElement("li");
        li.className = "text-body-secondary";
        li.textContent = step.step;
        ul.append(li);
      });
      wrap.append(ul);
    }

    frag.append(wrap);
  });

  const priorityMatrix = section("Priority Matrix");
  const note = document.createElement("p");
  note.className = "text-caption";
  note.textContent = "The Keystone prioritisation methodology is under active development.";
  priorityMatrix.append(note);
  frag.append(priorityMatrix);

  return frag;
}

export function renderAssessmentReport(container, params) {
  const state = getState();
  const { org, review } = findReview(state, params.organisationId, params.reviewId);

  const screen = document.createElement("div");
  screen.className = "screen stack";

  if (!org || !review) {
    const notFound = document.createElement("p");
    notFound.className = "text-body-secondary";
    notFound.textContent = "Report not found.";
    screen.append(notFound);
    container.append(screen);
    return;
  }

  const reportType = params.reportType === "diagnostic" ? "diagnostic" : "client";

  screen.append(renderCoverPage(org, review, reportType));
  screen.append(renderValueStatement());
  screen.append(renderExecutiveSummary(review));
  screen.append(renderStrengthsAndOpportunities(review));
  screen.append(renderRecommendationSection(review));

  if (reportType === "diagnostic") {
    screen.append(renderDiagnosticSections(review));
  }

  const actions = document.createElement("div");
  actions.className = "screen-actions stack-tight";
  actions.append(
    createButton({ label: "Export as PDF", variant: "primary", onClick: () => window.print() })
  );
  actions.append(createButton({ label: "Back", variant: "secondary", onClick: () => back() }));
  screen.append(actions);

  container.append(screen);
}
