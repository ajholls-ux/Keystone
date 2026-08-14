// ==========================================================================
// Decamark Field Kit — New Organisation View
//
// Screen 4 of the locked Screen Map (Part 2). Captures the organisation
// fields defined in Part 5. Fast, mobile-first, native input types.
// ==========================================================================

import { createTextField } from "../components/textField.js";
import { createButton } from "../components/button.js";
import { updateState } from "../state/store.js";
import { createOrganisation } from "../state/schema.js";
import { navigate, back } from "../router.js";

export function renderNewOrganisation(container) {
  const screen = document.createElement("div");
  screen.className = "screen";

  const heading = document.createElement("h1");
  heading.className = "text-heading-screen";
  heading.textContent = "New organisation";

  const form = document.createElement("form");
  form.className = "stack";
  form.noValidate = true;

  const businessName = createTextField({
    id: "businessName",
    label: "Business name",
    required: true,
  });
  const siteLocation = createTextField({
    id: "siteLocation",
    label: "Site / location",
  });
  const industryType = createTextField({
    id: "industryType",
    label: "Industry / type of operation",
  });
  const assessorName = createTextField({
    id: "assessorName",
    label: "Assessor name",
  });
  const peopleInvolved = createTextField({
    id: "peopleInvolved",
    label: "People involved",
    textarea: true,
  });
  const scopeOfReview = createTextField({
    id: "scopeOfReview",
    label: "Scope of review",
    textarea: true,
  });
  const purposeOfReview = createTextField({
    id: "purposeOfReview",
    label: "Purpose of review",
    textarea: true,
  });

  const errorMsg = document.createElement("p");
  errorMsg.className = "text-body-secondary";
  errorMsg.style.color = "var(--color-status-error)";
  errorMsg.style.display = "none";
  errorMsg.textContent = "Business name is required.";

  form.append(
    businessName.element,
    siteLocation.element,
    industryType.element,
    assessorName.element,
    peopleInvolved.element,
    scopeOfReview.element,
    purposeOfReview.element,
    errorMsg
  );

  const actions = document.createElement("div");
  actions.className = "screen-actions stack-tight";

  const saveBtn = createButton({
    label: "Save organisation",
    variant: "primary",
    type: "submit",
  });
  const cancelBtn = createButton({
    label: "Cancel",
    variant: "secondary",
    onClick: () => back(),
  });

  actions.append(saveBtn, cancelBtn);
  form.append(actions);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = businessName.input.value.trim();
    if (!name) {
      errorMsg.style.display = "block";
      businessName.input.focus();
      return;
    }

    const newOrg = createOrganisation({
      businessName: name,
      siteLocation: siteLocation.input.value.trim(),
      industryType: industryType.input.value.trim(),
      assessorName: assessorName.input.value.trim(),
      peopleInvolved: peopleInvolved.input.value.trim(),
      scopeOfReview: scopeOfReview.input.value.trim(),
      purposeOfReview: purposeOfReview.input.value.trim(),
    });

    updateState((state) => {
      state.organisations.push(newOrg);
      return state;
    });

    navigate("organisationList");
  });

  screen.append(heading, form);
  container.append(screen);
}
