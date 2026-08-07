// ==========================================================================
// Keystone Field Kit — Score Selector Component
// Maturity scale per Assessment Engine v1.0: 1 (Significant opportunity)
// through 4 (Strong / Mature). Assessor-entered only, never calculated.
// ==========================================================================

const SCORE_LABELS = {
  1: "Significant opportunity",
  2: "Developing",
  3: "Effective",
  4: "Strong / Mature",
};

/**
 * Creates a 1-4 score selector.
 * @param {Object} opts
 * @param {number|null} opts.value
 * @param {(score: number) => void} opts.onChange
 */
export function createScoreSelector({ value, onChange }) {
  const wrap = document.createElement("div");
  wrap.className = "score-selector";

  [1, 2, 3, 4].forEach((n) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "score-selector__option" + (value === n ? " score-selector__option--selected" : "");
    btn.innerHTML = `<span class="score-selector__num">${n}</span><span class="score-selector__label">${SCORE_LABELS[n]}</span>`;
    btn.addEventListener("click", () => onChange(n));
    wrap.append(btn);
  });

  return wrap;
}

export { SCORE_LABELS };
