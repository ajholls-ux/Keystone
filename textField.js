// ==========================================================================
// Keystone Field Kit — Text Field Component
// Labels always visible above the field (Part 4) — no placeholder-as-label.
// ==========================================================================

/**
 * Creates a labeled input or textarea field.
 * @param {Object} opts
 * @param {string} opts.id
 * @param {string} opts.label
 * @param {boolean} [opts.textarea] - render a <textarea> instead of <input>
 * @param {boolean} [opts.required]
 * @param {string} [opts.type] - native input type, defaults to 'text'
 * @param {string} [opts.inputmode]
 * @returns {{ element: HTMLElement, input: HTMLElement }}
 */
export function createTextField({
  id,
  label,
  textarea = false,
  required = false,
  type = "text",
  inputmode,
}) {
  const wrap = document.createElement("div");
  wrap.className = "field";

  const labelEl = document.createElement("label");
  labelEl.className = "field__label";
  labelEl.setAttribute("for", id);
  labelEl.textContent = required ? `${label} *` : label;

  const input = document.createElement(textarea ? "textarea" : "input");
  input.className = "field__input";
  input.id = id;
  input.name = id;
  if (!textarea) input.type = type;
  if (inputmode) input.inputMode = inputmode;
  if (required) input.required = true;
  if (textarea) input.rows = 3;

  wrap.append(labelEl, input);
  return { element: wrap, input };
}
