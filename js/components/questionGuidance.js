// ==========================================================================
// Keystone Field Kit -- Question Guidance Panel Component
// One collapsible "Assessor guidance" per question.
// Investigation help first. Scoring anchors optional and nested so they
// do not feel like per-question scores (pillar score stays at Your judgement).
// ==========================================================================

function textBlock(text) {
  if (!text) return null;
  const p = document.createElement("p");
  p.className = "guidance-panel__text";
  p.textContent = text;
  return p;
}

function listBlock(items) {
  if (!items || !items.length) return null;
  const ul = document.createElement("ul");
  ul.className = "guidance-panel__list";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "guidance-panel__text";
    li.textContent = item;
    ul.append(li);
  });
  return ul;
}

function section(heading, contentEl) {
  if (!contentEl) return null;
  const wrap = document.createElement("div");
  wrap.className = "guidance-panel__section";
  const h = document.createElement("p");
  h.className = "guidance-panel__heading";
  h.textContent = heading;
  wrap.append(h, contentEl);
  return wrap;
}

function maturityBlock(maturityGuidance) {
  if (!maturityGuidance) return null;
  const wrap = document.createElement("div");
  [1, 2, 3, 4].forEach((n) => {
    if (!maturityGuidance[n]) return;
    const row = document.createElement("p");
    row.className = "guidance-panel__text";
    row.textContent = `${n}: ${maturityGuidance[n]}`;
    wrap.append(row);
  });
  return wrap.childNodes.length ? wrap : null;
}

function confidenceBlock(confidenceGuidance) {
  if (!confidenceGuidance) return null;
  const wrap = document.createElement("div");
  [
    ["High", confidenceGuidance.high],
    ["Medium", confidenceGuidance.medium],
    ["Low", confidenceGuidance.low],
  ].forEach(([label, text]) => {
    if (!text) return;
    const row = document.createElement("p");
    row.className = "guidance-panel__text";
    row.textContent = `${label}: ${text}`;
    wrap.append(row);
  });
  return wrap.childNodes.length ? wrap : null;
}

/**
 * Single collapsed guidance panel for one methodology question.
 * @param {Object} q - a PILLAR_QUESTIONS entry
 */
export function createQuestionGuidance(q) {
  const details = document.createElement("details");
  details.className = "guidance-panel question-guidance";

  const summary = document.createElement("summary");
  summary.className = "guidance-panel__summary";
  summary.textContent = "Assessor guidance";
  details.append(summary);

  const body = document.createElement("div");
  body.className = "guidance-panel__body";

  // Investigation first (what you need while on site)
  const primary = [
    section("Why this matters", textBlock(q.whyItMatters)),
    section("How to ask", textBlock(q.assessorPrompt)),
    section("Follow-up prompts", listBlock(q.followUpPrompts)),
    section("Good example", textBlock(q.goodExample)),
    section("Poor example", textBlock(q.poorExample)),
    section("What to observe", listBlock(q.whatToObserve)),
    section("Evidence suggestions", listBlock(q.evidenceSuggestions)),
  ].filter(Boolean);

  primary.forEach((el) => body.append(el));

  // Scoring anchors last, nested: supports later pillar judgement only
  const scoringKids = [
    section("Maturity anchors for this question", maturityBlock(q.maturityGuidance)),
    section("Confidence anchors for this question", confidenceBlock(q.confidenceGuidance)),
    section("Diagnostic relevance", textBlock(q.diagnosticRelevance)),
  ].filter(Boolean);

  if (scoringKids.length) {
    const scoring = document.createElement("details");
    scoring.className = "guidance-panel guidance-panel--nested";
    const scoringSummary = document.createElement("summary");
    scoringSummary.className = "guidance-panel__summary";
    scoringSummary.textContent = "Scoring anchors (use at Your judgement)";
    const scoringBody = document.createElement("div");
    scoringBody.className = "guidance-panel__body";
    const note = document.createElement("p");
    note.className = "guidance-panel__text guidance-panel__text--note";
    note.textContent =
      "There is still only one maturity score and one confidence level for the whole pillar. These anchors help that judgement; they are not separate scores per question.";
    scoringBody.append(note);
    scoringKids.forEach((el) => scoringBody.append(el));
    scoring.append(scoringSummary, scoringBody);
    body.append(scoring);
  }

  details.append(body);
  return details;
}
