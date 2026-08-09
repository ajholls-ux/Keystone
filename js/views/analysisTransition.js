// ==========================================================================
// Keystone Field Kit — Analysis Transition View
//
// Screen 9 of the locked Screen Map. Deliberate brief transition between
// assessment completion and report generation, reinforcing that Keystone
// transforms captured information into insight. Auto-advances.
// ==========================================================================

import { replace } from "../router.js";

const STATES = ["Reviewing findings…", "Building operational profile…", "Preparing report…"];
const STEP_MS = 650;

export function renderAnalysisTransition(container, params) {
  const screen = document.createElement("div");
  screen.className = "screen";
  screen.style.justifyContent = "center";
  screen.style.alignItems = "center";
  screen.style.textAlign = "center";

  const label = document.createElement("p");
  label.className = "text-heading-section";
  label.textContent = STATES[0];

  screen.append(label);
  container.append(screen);

  let index = 0;
  const interval = setInterval(() => {
    index += 1;
    if (index < STATES.length) {
      label.textContent = STATES[index];
    } else {
      clearInterval(interval);
      // replace(), not navigate(): this screen must not remain in the
      // back stack, or pressing Back from the report would re-render this
      // transition, which would immediately auto-forward again — making
      // the report feel like it's being regenerated on every Back press.
      //
      // Forward all params through untouched (not a hand-picked subset) —
      // this screen has no business knowing which fields the report needs
      // (e.g. cycleId for a Diagnostic Report). A previous version only
      // forwarded organisationId/reviewId/reportType and silently dropped
      // cycleId, which broke Diagnostic Report lookup after this screen.
      replace("assessmentReport", params);
    }
  }, STEP_MS);
}
