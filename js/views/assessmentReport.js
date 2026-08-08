// ==========================================================================
// Keystone Field Kit — Assessment Report View
//
// Screen 10 of the locked Screen Map. Two distinct outputs sharing this
// screen: Client Report (free) and Diagnostic Report (paid, superset).
// Content strictly filtered per Assessment Engine v1.0 §Internal vs
// Client Behaviour — internal-only fields never render here.
//
// Milestone 3.6: the viewer chrome (Back / Export PDF) is structurally
// separate from the report document itself. Only .report-document is
// visible when printing — see css/print.css.
// ==========================================================================

import { getState } from "../state/store.js";
import { PILLARS, calculateHealthIndicator, SCORE_LABELS } from "../state/schema.js";
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
  if (titleText) {
    const h = document.createElement("h2");
    h.className = "text-heading-section";
    h.textContent = titleText;
    wrap.append(h);
  }
  return wrap;
}

function renderCoverPage(org, review, reportType) {
  const cover = document.createElement("div");
  cover.className = "report-cover stack-loose";

  const brand = document.createElement("p");
  brand.className = "text-caption";
  brand.style.letterSpacing = "0.08em";
  brand.style.textTransform = "uppercase";
  brand.textContent = "Keystone Field Kit";

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

  const valueStatement = document.createElement("p");
  valueStatement.className = "text-body-secondary";
  valueStatement.style.maxWidth = "480px";
  valueStatement.style.margin = "0 auto";
  valueStatement.textContent =
    "This report reflects a structured, evidence-led assessment of your operation. Every observation, strength, and opportunity identified here is grounded in what was directly observed, discussed, and evidenced on site.";

  cover.append(brand, title, orgName, meta, valueStatement);
  return cover;
}

function renderExecutiveSummary(review) {
  const wrap = section("Executive Summary");

  const strengthsCount = review.pillarAssessments.reduce((n, p) => n + p.strengths.length, 0);
  const opportunitiesCount = review.pillarAssessments.reduce((n, p) => n + p.opportunities.length, 0);

  const summary = document.createElement("p");
  summary.className = "text-body-secondary";
  summary.textContent = `This review identified ${strengthsCount} operational strength${
    strengthsCount === 1 ? "" : "s"
  } and ${opportunitiesCount} opportunit${
    opportunitiesCount === 1 ? "y" : "ies"
  } for further consideration across all ten operational pillars.`;

  wrap.append(summary);
  return wrap;
}

function renderOverallHealth(review) {
  const wrap = section("Overall Operational Health");
  const indicator = calculateHealthIndicator(review.pillarAssessments);

  const indicatorRow = document.createElement("p");
  indicatorRow.className = "health-indicator";
  indicatorRow.innerHTML = `<span class="health-indicator__emoji">${indicator.emoji}</span><span>${indicator.label}</span>`;

  wrap.append(indicatorRow);
  return wrap;
}

function renderStrengths(review) {
  const allStrengths = [];
  review.pillarAssessments.forEach((pillar) => {
    const pillarMeta = PILLARS.find((p) => p.key === pillar.pillarKey);
    pillar.strengths.forEach((s) => allStrengths.push({ pillar: pillarMeta.name, text: s }));
  });

  const wrap = section("Strengths");
  if (allStrengths.length === 0) {
    const p = document.createElement("p");
    p.className = "text-body-secondary";
    p.textContent = "No strengths recorded.";
    wrap.append(p);
    return wrap;
  }

  const ul = document.createElement("ul");
  allStrengths.forEach(({ pillar, text }) => {
    const li = document.createElement("li");
    li.className = "text-body-secondary";
    li.textContent = `${text} (${pillar})`;
    ul.append(li);
  });
  wrap.append(ul);
  return wrap;
}

function renderOpportunities(review) {
  const allOpportunities = [];
  review.pillarAssessments.forEach((pillar) => {
    const pillarMeta = PILLARS.find((p) => p.key === pillar.pillarKey);
    pillar.opportunities.forEach((o) => allOpportunities.push({ pillar: pillarMeta.name, text: o }));
  });

  const wrap = section("Opportunities");
  if (allOpportunities.length === 0) {
    const p = document.createElement("p");
    p.className = "text-body-secondary";
    p.textContent = "No opportunities recorded.";
    wrap.append(p);
    return wrap;
  }

  const ul = document.createElement("ul");
  allOpportunities.forEach(({ pillar, text }) => {
    const li = document.createElement("li");
    li.className = "text-body-secondary";
    li.textContent = `${text} (${pillar})`;
    ul.append(li);
  });
  wrap.append(ul);
  return wrap;
}

function renderPillarOverview(review) {
  const wrap = section("Pillar Overview");
  const dl = document.createElement("dl");
  dl.style.margin = "0";

  review.pillarAssessments.forEach((pillar) => {
    const pillarMeta = PILLARS.find((p) => p.key === pillar.pillarKey);
    const row = document.createElement("div");
    row.className = "summary-card__row";
    const dt = document.createElement("dt");
    dt.textContent = pillarMeta.name;
    const dd = document.createElement("dd");
    dd.textContent = pillar.maturityScore ? SCORE_LABELS[pillar.maturityScore] : "Not yet scored";
    row.append(dt, dd);
    dl.append(row);
  });

  wrap.append(dl);
  return wrap;
}

function renderProfessionalObservations(review) {
  const withObservations = review.pillarAssessments.filter((p) => p.professionalObservation);
  if (withObservations.length === 0) return document.createDocumentFragment();

  const wrap = section("Professional Observations");
  withObservations.forEach((pillar) => {
    const pillarMeta = PILLARS.find((p) => p.key === pillar.pillarKey);
    const pillarHeading = document.createElement("p");
    pillarHeading.style.fontWeight = "600";
    pillarHeading.style.marginTop = "var(--space-2)";
    pillarHeading.textContent = pillarMeta.name;
    const obs = document.createElement("p");
    obs.className = "text-body-secondary";
    obs.textContent = pillar.professionalObservation;
    wrap.append(pillarHeading, obs);
  });
  return wrap;
}

function renderFurtherConsideration(review) {
  const copy = RECOMMENDATION_COPY[review.diagnosticRecommendation];
  if (!copy) return document.createDocumentFragment();

  const wrap = section(copy.heading);
  const body = document.createElement("p");
  body.className = "text-body-secondary";
  body.textContent = copy.body;
  wrap.append(body);
  return wrap;
}

function renderClosing() {
  const wrap = section("Closing");
  const p = document.createElement("p");
  p.className = "text-body-secondary";
  p.textContent =
    "This review reflects our professional assessment based on the evidence gathered during the visit. We appreciate the time and openness shown throughout the process, and are glad to discuss any of these findings further.";
  wrap.append(p);
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

  // Viewer chrome — never printed, never part of the document itself.
  const toolbar = document.createElement("div");
  toolbar.className = "report-toolbar";
  toolbar.append(
    createButton({ label: "Back", variant: "secondary", onClick: () => back() }),
    createButton({ label: "Export PDF", variant: "primary", onClick: () => window.print() })
  );

  // The report document — this, and only this, is what prints.
  const doc = document.createElement("div");
  doc.className = "report-document";

  doc.append(renderCoverPage(org, review, reportType));
  doc.append(renderExecutiveSummary(review));
  doc.append(renderOverallHealth(review));
  doc.append(renderStrengths(review));
  doc.append(renderOpportunities(review));
  doc.append(renderPillarOverview(review));
  doc.append(renderProfessionalObservations(review));
  doc.append(renderFurtherConsideration(review));

  if (reportType === "diagnostic") {
    doc.append(renderDiagnosticSections(review));
  }

  doc.append(renderClosing());

  screen.append(toolbar, doc);
  container.append(screen);
}
