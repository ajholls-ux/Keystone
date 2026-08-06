// ==========================================================================
// Keystone Field Kit — App Entry Point
//
// Initialises the store, initialises the router, registers all views,
// and mounts the first screen. This is the only file that wires the
// data, navigation, and view layers together.
// ==========================================================================

import { initStore } from "./state/store.js";
import { initRouter, registerView, replace } from "./router.js";
import { renderLanding } from "./views/landing.js";
import { renderOrganisationList } from "./views/organisationList.js";
import { renderNewOrganisation } from "./views/newOrganisation.js";
import { renderOrganisationDetail } from "./views/organisationDetail.js";

function start() {
  initStore();

  const mountEl = document.getElementById("app");
  initRouter(mountEl);

  registerView("landing", renderLanding);
  registerView("organisationList", renderOrganisationList);
  registerView("newOrganisation", renderNewOrganisation);
  registerView("organisationDetail", renderOrganisationDetail);

  // Initial screen. Uses replace() rather than navigate() so the stack
  // starts with exactly one entry, not two.
  replace("landing");
}

document.addEventListener("DOMContentLoaded", start);
