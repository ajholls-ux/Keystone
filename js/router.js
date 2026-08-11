// ==========================================================================
// Keystone Field Kit — Router
//
// Minimal stack-based navigation controller (Part 2: stack-based, not
// tab-based). No framework, no URL-based routing needed for MVP — this is
// a single-session field tool, not a shareable-link web app.
// ==========================================================================

const registry = new Map();
const stack = [];
let rootEl = null;

/** Registers a view. `renderFn(container, params)` should render into container. */
export function registerView(name, renderFn) {
  registry.set(name, renderFn);
}

/** Call once at startup to bind the router to its mount point. */
export function initRouter(mountEl) {
  rootEl = mountEl;
}

function render(name, params) {
  const renderFn = registry.get(name);
  if (!renderFn) {
    console.error(`Keystone: no view registered for "${name}".`);
    return;
  }
  rootEl.innerHTML = "";
  renderFn(rootEl, params);
}

/** Navigates forward to a view, pushing the current one onto the stack. */
export function navigate(name, params = {}) {
  stack.push({ name, params });
  render(name, params);
}

/** Replaces the current view without growing the stack (e.g. initial mount). */
export function replace(name, params = {}) {
  stack[stack.length - 1] = { name, params };
  render(name, params);
}

/** Navigates back to the previous view in the stack, if any. */
export function back() {
  if (stack.length <= 1) return;
  stack.pop();
  const previous = stack[stack.length - 1];
  render(previous.name, previous.params);
}

export function canGoBack() {
  return stack.length > 1;
}
