// ==========================================================================
// Keystone Field Kit — Status Marker Component
// Status is never colour-only: dot + label always paired (Part 4).
// Not used until Milestone 2+ (Organisation List / Review Overview),
// established now so the component pattern is consistent from the start.
// ==========================================================================

const LABELS = {
  "not-started": "Not started",
  "in-progress": "In progress",
  "complete": "Complete",
};

/**
 * Creates a status marker element.
 * @param {'not-started'|'in-progress'|'complete'} status
 */
export function createStatusMarker(status) {
  const wrap = document.createElement("span");
  wrap.className = `status-marker status-marker--${status}`;

  const dot = document.createElement("span");
  dot.className = "status-marker__dot";
  dot.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.className = "status-marker__label";
  label.textContent = LABELS[status] || status;

  wrap.append(dot, label);
  return wrap;
}
