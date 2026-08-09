// ==========================================================================
// Keystone Field Kit — Question Guidance Panel Component
// Methodology Engine v1.0. Renders the full guidance chain for one
// methodology question (PILLAR_QUESTIONS entry). Distinct from the
// generic field-level guidance panel (guidancePanel.js) — this one is
// richer and specific to a single, named assessment question.
// ==========================================================================

function collapsibleSection(label, contentEl) {
  const details = document.createElement("details");
  details.className = "guidance-panel";

  const summary = document.createElement("summary");
  summary.className = "guidance-panel__summary";
  summary.textContent = label;
  details.append(summary);

  const body = document.createElement("div");
  body.className = "guidance-panel__body";
  body.append(contentEl);
  details.append(body);

  return details;
}

function textBlock(text) {
  const p = document.createElement("p");
  p.className = "guidance-panel__text";
  p.textContent = text;
  return p;
}

function listBlock(items) {
  const ul = document.createElement("ul");
  ul.style.margin = "0";
  ul.style.paddingLeft = "18px";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "guidance-panel__text";
    li.textContent = item;
    ul.append(li);
  });
  return ul;
}

function maturityBlock(maturityGuidance) {
  const wrap = document.createElement("div");
  [1, 2, 3, 4].forEach((n) => {
    const row = document.createElement("p");
    row.className = "guidance-panel__text";
    row.innerHTML = `<strong>${n}</strong> — ${maturityGuidance[n]}`;
    wrap.append(row);
  });
  return wrap;
}

function confidenceBlock(confidenceGuidance) {
  const wrap = document.createElement("div");
  [
    ["High", confidenceGuidance.high],
    ["Medium", confidenceGuidance.medium],
    ["Low", confidenceGuidance.low],
  ].forEach(([label, text]) => {
    const row = document.createElement("p");
    row.className = "guidance-panel__text";
    row.innerHTML = `<strong>${label}</strong> — ${text}`;
    wrap.append(row);
  });
  return wrap;
}

/**
 * Creates the full collapsible guidance chain for one methodology
 * question. Each sub-section (why it matters, how to ask, etc.) is its
 * own collapsible unit, per the locked guidance UI structure.
 * @param {Object} q - a PILLAR_QUESTIONS entry
 */
export function createQuestionGuidance(q) {
  const wrap = document.createElement("div");
  wrap.className = "stack-tight";

  wrap.append(
    collapsibleSection("Why this matters", textBlock(q.whyItMatters)),
    collapsibleSection("How to ask it", textBlock(q.assessorPrompt)),
    collapsibleSection("Follow-up prompts", listBlock(q.followUpPrompts)),
    collapsibleSection("Good example", textBlock(q.goodExample)),
    collapsibleSection("Poor example", textBlock(q.poorExample)),
    collapsibleSection("What to observe", listBlock(q.whatToObserve)),
    collapsibleSection("Evidence suggestions", listBlock(q.evidenceSuggestions)),
    collapsibleSection("Maturity guidance", maturityBlock(q.maturityGuidance)),
    collapsibleSection("Confidence guidance", confidenceBlock(q.confidenceGuidance)),
    collapsibleSection("Diagnostic relevance", textBlock(q.diagnosticRelevance))
  );

  return wrap;
}
