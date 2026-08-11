// ==========================================================================
// Keystone Field Kit — List Editor Component
// Reusable add/display list for simple text entries (strengths,
// opportunities) or structured entries (evidence). Used across the Pillar
// Assessment screen rather than building three near-identical UIs.
// ==========================================================================

/**
 * Creates a simple text-entry list editor (add + display + remove).
 * @param {Object} opts
 * @param {string} opts.placeholder
 * @param {string[]} opts.items
 * @param {(items: string[]) => void} opts.onChange
 */
/**
 * Creates a single large auto-growing textarea bound to a string[] array,
 * one point per line. Used for Strengths/Opportunities — these are
 * assessor conclusions/synthesis, not multi-source evidence, so they
 * don't need the Add-button list pattern that createTextListEditor uses.
 * The underlying storage remains a string[] array (schema unchanged);
 * only the input affordance differs.
 * @param {Object} opts
 * @param {string} opts.placeholder
 * @param {string[]} opts.items
 * @param {(items: string[]) => void} opts.onChange
 */
export function createFreeTextAreaField({ placeholder, items, onChange }) {
  const textarea = document.createElement("textarea");
  textarea.className = "field__input list-editor__textarea";
  textarea.placeholder = placeholder;
  textarea.rows = 4;
  textarea.value = items.join("\n");

  textarea.addEventListener("input", () => {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  });

  textarea.addEventListener("blur", () => {
    const lines = textarea.value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    onChange(lines);
  });

  return textarea;
}

export function createTextListEditor({ placeholder, items, onChange }) {
  const wrap = document.createElement("div");
  wrap.className = "list-editor";

  const list = document.createElement("ul");
  list.className = "list-editor__list";

  function renderList() {
    list.innerHTML = "";
    items.forEach((text, index) => {
      const li = document.createElement("li");
      li.className = "list-editor__item list-editor__item--entry";

      const span = document.createElement("span");
      span.className = "list-editor__entry-text";
      span.textContent = text;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "list-editor__remove";
      removeBtn.setAttribute("aria-label", "Remove");
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", () => {
        items.splice(index, 1);
        onChange(items);
        renderList();
      });

      li.append(span, removeBtn);
      list.append(li);
    });
  }

  const inputRow = document.createElement("div");
  inputRow.className = "list-editor__input-row";

  const input = document.createElement("textarea");
  input.className = "field__input list-editor__textarea";
  input.placeholder = placeholder;
  input.rows = 3;

  // Auto-grow as content increases, so the assessor can always see what
  // they've written rather than fighting a fixed-height box.
  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
  });

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "list-editor__add";
  addBtn.textContent = "Add";

  function commit() {
    const val = input.value.trim();
    if (!val) return;
    items.push(val);
    onChange(items);
    input.value = "";
    input.style.height = "auto";
    renderList();
  }

  addBtn.addEventListener("click", commit);
  // Enter now inserts a newline (textarea, multi-line professional
  // writing) rather than submitting — submission is the explicit Add
  // button only.

  inputRow.append(input, addBtn);
  renderList();
  wrap.append(list, inputRow);
  return wrap;
}

/**
 * Creates a structured evidence list editor: source type + content.
 * @param {Object} opts
 * @param {string[]} opts.sourceTypes
 * @param {Array<{id, sourceType, content, capturedAt}>} opts.items
 * @param {(items) => void} opts.onChange
 */
export function createEvidenceListEditor({ sourceTypes, items, onChange }) {
  const wrap = document.createElement("div");
  wrap.className = "list-editor";

  const list = document.createElement("ul");
  list.className = "list-editor__list";

  function renderList() {
    list.innerHTML = "";
    items.forEach((entry, index) => {
      const li = document.createElement("li");
      li.className = "list-editor__item list-editor__item--evidence";

      const meta = document.createElement("div");
      meta.className = "list-editor__evidence-meta";
      meta.textContent = entry.sourceType;

      const content = document.createElement("div");
      content.textContent = entry.content;

      const textWrap = document.createElement("div");
      textWrap.append(meta, content);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "list-editor__remove";
      removeBtn.setAttribute("aria-label", "Remove");
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", () => {
        items.splice(index, 1);
        onChange(items);
        renderList();
      });

      li.append(textWrap, removeBtn);
      list.append(li);
    });
  }

  const select = document.createElement("select");
  select.className = "field__input";

  const placeholderOpt = document.createElement("option");
  placeholderOpt.value = "";
  placeholderOpt.textContent = "Select source...";
  placeholderOpt.disabled = true;
  placeholderOpt.selected = true;
  select.append(placeholderOpt);

  sourceTypes.forEach((type) => {
    const opt = document.createElement("option");
    opt.value = type;
    opt.textContent = type;
    select.append(opt);
  });

  const textarea = document.createElement("textarea");
  textarea.className = "field__input";
  textarea.rows = 2;
  textarea.placeholder = "What was observed, said, or found?";

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "list-editor__add";
  addBtn.textContent = "Add evidence";

  addBtn.addEventListener("click", () => {
    const content = textarea.value.trim();
    if (!content) return;
    if (!select.value) {
      window.alert("Please select a source before adding evidence.");
      select.focus();
      return;
    }
    items.push({
      id: `ev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      sourceType: select.value,
      entryType: "text", // reserved: future values "voice" | "photo" slot in
                          // here without restructuring the evidence array
      content,
      capturedAt: new Date().toISOString(),
    });
    onChange(items);
    textarea.value = "";
    select.value = "";
    renderList();
  });

  renderList();
  wrap.append(list, select, textarea, addBtn);
  return wrap;
}
