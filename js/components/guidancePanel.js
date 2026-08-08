// ==========================================================================
// Keystone Field Kit — Guidance Panel Component
// Collapsible assessor guidance per pillar (Milestone 3.5). Renders the
// GUIDANCE_SECTIONS framework; shows "Not yet added" for empty sections
// so it stays honest about what's authored vs. placeholder.
// ==========================================================================

import { GUIDANCE_SECTIONS } from "../state/schema.js";

/**
 * @param {Object} guidance - keyed by GUIDANCE_SECTIONS[].key
 */
export function createGuidancePanel(guidance) {
  const details = document.createElement("details");
  details.className = "guidance-panel";

  const summary = document.createElement("summary");
  summary.className = "guidance-panel__summary";
  summary.textContent = "Assessor guidance";
  details.append(summary);

  const body = document.createElement("div");
  body.className = "guidance-panel__body";

  GUIDANCE_SECTIONS.forEach(({ key, label }) => {
    const section = document.createElement("div");
    section.className = "guidance-panel__section";

    const heading = document.createElement("p");
    heading.className = "guidance-panel__heading";
    heading.textContent = label;

    const content = document.createElement("p");
    const value = guidance?.[key];
    if (value) {
      content.className = "guidance-panel__text";
      content.textContent = value;
    } else {
      content.className = "guidance-panel__empty";
      content.textContent = "Not yet added.";
    }

    section.append(heading, content);
    body.append(section);
  });

  details.append(body);
  return details;
}
