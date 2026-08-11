// ==========================================================================
// Keystone Field Kit -- Guidance Panel Component
// Collapsible assessor guidance per pillar (Milestone 3.5). Renders the
// GUIDANCE_SECTIONS framework; shows "Not yet added" for empty sections
// so it stays honest about what's authored vs. placeholder.
//
// Scoring guidance (maturity 1–4, confidence High/Medium/Low) is parsed
// into distinct level blocks so levels do not bleed into each other.
// ==========================================================================

import { GUIDANCE_SECTIONS } from "../state/schema.js";

/**
 * Detects and parses level-structured scoring text.
 * Supports:
 *   "1 -- Label\nbody\n\n2 -- Label\nbody..."
 *   "High\nbody\n\nMedium\nbody..."
 * Returns { levels: [{title, body}], trailing } or null if not level-shaped.
 */
function parseLevelBlocks(text) {
  if (!text || typeof text !== "string") return null;

  // Split on blank lines into chunks
  const chunks = text
    .split(/\n\s*\n/)
    .map((c) => c.trim())
    .filter(Boolean);

  if (chunks.length < 2) return null;

  const levelTitle =
    /^(?:([1-4])\s*[--–-]\s*(.+)|(?:High|Medium|Low))$/i;

  const levels = [];
  const trailing = [];

  for (const chunk of chunks) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const first = lines[0];
    const match = first.match(levelTitle);

    if (match) {
      let title;
      if (match[1]) {
        // "1 -- Significant Opportunity"
        title = `${match[1]} -- ${match[2].trim()}`;
      } else {
        // "High" / "Medium" / "Low"
        title = first;
      }
      const body = lines.slice(1).join(" ").trim() || "";
      // If body empty, the rest of the chunk after the title line may be on same structure
      levels.push({
        title,
        body: body || (lines.length === 1 ? "" : lines.slice(1).join(" ")),
      });
    } else if (levels.length > 0) {
      // After levels have started, non-matching chunks are trailing notes
      trailing.push(chunk.replace(/\n/g, " ").trim());
    } else {
      // Leading prose before any level -- keep as trailing only if we never find levels
      trailing.push(chunk.replace(/\n/g, " ").trim());
    }
  }

  // Need at least 2 recognised levels to treat as structured scoring guidance
  if (levels.length < 2) return null;

  return { levels, trailing };
}

/**
 * Renders guidance body text: structured levels when possible,
 * otherwise paragraph-split plain text.
 */
function renderGuidanceContent(parent, value) {
  const parsed = parseLevelBlocks(value);

  if (parsed) {
    parsed.levels.forEach(({ title, body }) => {
      const block = document.createElement("div");
      block.className = "guidance-panel__level";

      const titleEl = document.createElement("p");
      titleEl.className = "guidance-panel__level-title";
      titleEl.textContent = title;

      block.append(titleEl);

      if (body) {
        const bodyEl = document.createElement("p");
        bodyEl.className = "guidance-panel__level-body";
        bodyEl.textContent = body;
        block.append(bodyEl);
      }

      parent.append(block);
    });

    parsed.trailing.forEach((note) => {
      if (!note) return;
      const p = document.createElement("p");
      p.className = "guidance-panel__text guidance-panel__text--note";
      p.textContent = note;
      parent.append(p);
    });
    return;
  }

  // Default: split on blank lines into paragraphs; single newlines → space
  const paragraphs = value
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    const p = document.createElement("p");
    p.className = "guidance-panel__text";
    p.textContent = value;
    parent.append(p);
    return;
  }

  paragraphs.forEach((para) => {
    const p = document.createElement("p");
    p.className = "guidance-panel__text";
    p.textContent = para;
    parent.append(p);
  });
}

/**
 * @param {Object} guidance - keyed by GUIDANCE_SECTIONS[].key
 * @param {string} [triggerLabel] - defaults to "Guidance"
 */
export function createGuidancePanel(guidance, triggerLabel = "Guidance") {
  const details = document.createElement("details");
  details.className = "guidance-panel";

  const summary = document.createElement("summary");
  summary.className = "guidance-panel__summary";
  summary.textContent = triggerLabel;
  details.append(summary);

  const body = document.createElement("div");
  body.className = "guidance-panel__body";

  GUIDANCE_SECTIONS.forEach(({ key, label }) => {
    const value = guidance?.[key];
    // Skip empty sections so the panel only shows authored content
    if (!value) return;

    const section = document.createElement("div");
    section.className = "guidance-panel__section";

    const heading = document.createElement("p");
    heading.className = "guidance-panel__heading";
    heading.textContent = label;

    section.append(heading);
    renderGuidanceContent(section, value);
    body.append(section);
  });

  // If nothing was authored, show a single empty state
  if (!body.children.length) {
    const empty = document.createElement("p");
    empty.className = "guidance-panel__empty";
    empty.textContent = "Not yet added.";
    body.append(empty);
  }

  details.append(body);
  return details;
}
