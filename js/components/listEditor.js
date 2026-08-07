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
export function createTextListEditor({ placeholder, items, onChange }) {
  const wrap = document.createElement("div");
  wrap.className = "list-editor";

  const list = document.createElement("ul");
  list.className = "list-editor__list";

  function renderList() {
    list.innerHTML = "";
    items.forEach((text, index) => {
      const li = document.createElement("li");
      li.className = "list-editor__item";

      const span = document.createElement("span");
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

  const input = document.createElement("input");
  input.type = "text";
  input.className = "field__input";
  input.placeholder = placeholder;

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
    renderList();
  }

  addBtn.addEventListener("click", commit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
  });

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
    items.push({
      id: `ev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      sourceType: select.value,
      content,
      capturedAt: new Date().toISOString(),
    });
    onChange(items);
    textarea.value = "";
    renderList();
  });

  renderList();
  wrap.append(list, select, textarea, addBtn);
  return wrap;
}
