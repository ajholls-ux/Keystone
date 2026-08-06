// ==========================================================================
// Keystone Field Kit — Card Component
// Used for list items only (organisation list, later pillar list) —
// not a general-purpose container (Part 4).
// ==========================================================================

/**
 * Creates a tappable card for a list item.
 * @param {Object} opts
 * @param {() => void} [opts.onClick]
 * @returns {HTMLElement}
 */
export function createCard({ onClick } = {}) {
  const card = document.createElement(onClick ? "button" : "div");
  card.className = "card";
  if (onClick) {
    card.type = "button";
    card.addEventListener("click", onClick);
  }
  return card;
}
