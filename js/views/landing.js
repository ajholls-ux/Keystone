// ==========================================================================
// Keystone Field Kit - Landing View
//
// Screen 2 of the locked Screen Map (Part 2). Not a marketing website -
// establishes identity and moves the assessor into the tool. Copy below is
// placeholder per founder note, but written to hold the intended
// positioning: professional, calm, precise, operational. No feature-benefit
// SaaS language.
// ==========================================================================

import { createButton } from "../components/button.js";
import { navigate } from "../router.js";
import { APP_VERSION } from "../state/schema.js";

export function renderLanding(container) {
  const screen = document.createElement("div");
  screen.className = "screen";

  const content = document.createElement("div");
  content.className = "stack-loose";
  content.style.marginTop = "auto";
  content.style.marginBottom = "auto";

  const heading = document.createElement("h1");
  heading.className = "text-display";
  heading.textContent = "Keystone Field Kit";

  const subhead = document.createElement("p");
  subhead.className = "text-body-secondary";
  subhead.textContent =
    "A structured instrument for assessing operational health - built for use on site.";

  const version = document.createElement("p");
  version.className = "text-caption app-version";
  version.textContent = "Version " + APP_VERSION;

  content.append(heading, subhead, version);

  const actions = document.createElement("div");
  actions.className = "screen-actions";
  actions.style.marginTop = "0";

  const continueBtn = createButton({
    label: "Continue to Keystone",
    variant: "primary",
    onClick: () => navigate("organisationList"),
  });

  actions.append(continueBtn);

  screen.append(content, actions);
  container.append(screen);
}
