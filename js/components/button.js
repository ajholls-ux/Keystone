// ==========================================================================
// Keystone Field Kit — Button Component
// One primary variant, one secondary variant. No tertiary variant (Part 4).
// ==========================================================================

/**
 * Creates a <button> element.
 * @param {Object} opts
 * @param {string} opts.label
 * @param {'primary'|'secondary'} [opts.variant]
 * @param {() => void} opts.onClick
 * @param {string} [opts.type] - native button type, defaults to 'button'
 */
export function createButton({ label, variant = "primary", onClick, type = "button" }) {
  const btn = document.createElement("button");
  btn.type = type;
  btn.className = `btn btn-${variant}`;
  btn.textContent = label;
  if (onClick) btn.addEventListener("click", onClick);
  return btn;
}
