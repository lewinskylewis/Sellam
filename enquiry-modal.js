(function () {
  const config = {
    endpoint: "/api/enquiry",
    ...(window.SELLAM_ENQUIRY_CONFIG || {})
  };

  let modal;
  let modalForm;
  let lastFocusedElement;

  function createModal() {
    if (document.querySelector("[data-enquiry-modal]")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "enquiry-modal";
    wrapper.dataset.enquiryModal = "";
    wrapper.setAttribute("aria-hidden", "true");
    wrapper.innerHTML = `
      <div class="enquiry-dialog" role="dialog" aria-modal="true" aria-labelledby="enquiryModalTitle">
        <button class="enquiry-close" type="button" data-enquiry-close aria-label="Close enquiry form">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6.34 5 12.66 12.66-1.34 1.34L5 6.34 6.34 5Zm12.66 1.34L6.34 19 5 17.66 17.66 5 19 6.34Z"/>
          </svg>
        </button>
        <form class="modal-enquiry-form" data-enquiry-form method="post">
          <h2 id="enquiryModalTitle">Enquiry Form</h2>
          <input type="hidden" name="property_id" data-enquiry-property-id>
          <input type="hidden" name="property_title" data-enquiry-property-title>
          <input type="hidden" name="property_url" data-enquiry-property-url>
          <input type="hidden" name="listing_category" data-enquiry-listing-category>
          <input type="hidden" name="source_page" data-enquiry-source-page>
          <div class="modal-field-row">
            <label>
              <span>First name</span>
              <input type="text" name="first_name" placeholder="John" autocomplete="given-name" maxlength="60" required>
            </label>
            <label>
              <span>Last name</span>
              <input type="text" name="last_name" placeholder="Doe" autocomplete="family-name" maxlength="60" required>
            </label>
          </div>
          <label>
            <span>Email address</span>
            <input type="email" name="email" placeholder="Example@Gmail.Com" autocomplete="email" maxlength="254" required>
          </label>
          <label>
            <span>Phone</span>
            <input type="tel" name="phone" placeholder="+254 700 000 000" autocomplete="tel" maxlength="40" required>
          </label>
          <label>
            <span>Message</span>
            <textarea name="message" placeholder="Message" minlength="10" maxlength="4000" required></textarea>
          </label>
          <p class="enquiry-status" data-enquiry-status aria-live="polite"></p>
          <button class="modal-enquiry-submit" type="submit">Submit</button>
        </form>
      </div>
    `;

    document.body.append(wrapper);
  }

  function absoluteUrl(value) {
    try {
      return new URL(value || window.location.href, document.baseURI).href;
    } catch (_error) {
      return window.location.href;
    }
  }

  function inventoryProperty(propertyId, pageSlug, title) {
    if (!Array.isArray(window.SELLAM_PROPERTIES)) return null;
    return window.SELLAM_PROPERTIES.find((property) =>
      property.id === propertyId ||
      property.slug === pageSlug ||
      property.title?.trim().toLowerCase() === title?.trim().toLowerCase()
    ) || null;
  }

  function categoryFor(property, fallback) {
    if (fallback) return fallback;
    if (!property) return "property-detail";
    if (property.collection === "exclusive") return "exclusive";
    if (property.letting === "both") return "sale-and-rent";
    return property.letting || property.collection || "property-detail";
  }

  function categoryFromReferrer() {
    if (!document.referrer) return "";
    try {
      const page = new URL(document.referrer).pathname.split("/").pop()?.toLowerCase();
      if (page === "rent.html") return "rent";
      if (page === "premium-properties.html") return "sale";
      if (page === "exclusive-properties.html") return "exclusive";
    } catch (_error) {
      return "";
    }
    return "";
  }

  function getPageContext() {
    const queryPropertyId = new URLSearchParams(window.location.search).get("id");
    const pageSlug = document.body.dataset.propertyKey ||
      queryPropertyId ||
      window.location.pathname.split("/").pop()?.replace(/\.html$/i, "") ||
      "website-enquiry";
    const title = document.querySelector("[data-property-title]")?.textContent?.trim() || document.title;
    const property = inventoryProperty("", pageSlug, title);
    const listing = document.querySelector("[data-property-rows]")?.dataset.listing || categoryFromReferrer();

    return {
      propertyId: property?.id || pageSlug,
      title: property?.title || title,
      propertyUrl: absoluteUrl(property?.url || window.location.href),
      listingCategory: categoryFor(property, listing),
      sourcePage: window.location.href,
      location: property?.location || ""
    };
  }

  function getTriggerContext(trigger) {
    const card = trigger.closest("[data-card]");
    const pageContext = getPageContext();
    const propertyId = trigger.dataset.propertyId || card?.dataset.propertyId || card?.id || pageContext.propertyId;
    const title = trigger.dataset.property || card?.dataset.title || pageContext.title;
    const pageSlug = card?.id || pageContext.propertyId;
    const property = inventoryProperty(propertyId, pageSlug, title);
    const location = trigger.dataset.location || card?.dataset.location || property?.location || pageContext.location;
    const rawPropertyUrl = trigger.dataset.propertyUrl || card?.dataset.propertyUrl || property?.url || pageContext.propertyUrl;
    const listingCategory = trigger.dataset.listingCategory || card?.dataset.listingCategory ||
      document.querySelector("[data-property-rows]")?.dataset.listing || pageContext.listingCategory;

    return {
      propertyId: property?.id || propertyId,
      title: property?.title || title,
      propertyUrl: absoluteUrl(rawPropertyUrl),
      listingCategory: categoryFor(property, listingCategory),
      sourcePage: window.location.href,
      location
    };
  }

  function setFormContext(targetForm, context) {
    const values = {
      property_id: context.propertyId,
      property_title: context.title,
      property_url: context.propertyUrl,
      listing_category: context.listingCategory,
      source_page: context.sourcePage
    };

    Object.entries(values).forEach(([name, value]) => {
      const input = targetForm.elements[name];
      if (input) input.value = value || "";
    });
  }

  function setStatus(targetForm, message, type = "") {
    const status = targetForm.querySelector("[data-enquiry-status]");
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-error", type === "error");
    status.classList.toggle("is-success", type === "success");
  }

  function prepareForm(targetForm) {
    if (targetForm.dataset.enquiryPrepared === "true") return;
    targetForm.dataset.enquiryPrepared = "true";

    const honeypot = document.createElement("div");
    honeypot.className = "enquiry-honeypot";
    honeypot.setAttribute("aria-hidden", "true");
    honeypot.innerHTML = `
      <label>Website
        <input type="text" name="website" tabindex="-1" autocomplete="off">
      </label>
    `;
    targetForm.prepend(honeypot);

    if (!targetForm.querySelector("[data-enquiry-status]")) {
      const status = document.createElement("p");
      status.className = "enquiry-status";
      status.dataset.enquiryStatus = "";
      status.setAttribute("aria-live", "polite");
      targetForm.querySelector("button[type='submit']")?.before(status);
    }

    const limits = {
      name: { minLength: 2, maxLength: 120 },
      email: { maxLength: 254 },
      phone: { minLength: 7, maxLength: 40 },
      message: { minLength: 10, maxLength: 4000 }
    };

    Object.entries(limits).forEach(([name, attributes]) => {
      const input = targetForm.elements[name];
      if (!input) return;
      Object.entries(attributes).forEach(([attribute, value]) => {
        input[attribute] = value;
      });
    });
  }

  function openModal(trigger) {
    if (!modal || !modalForm) return;

    const context = getTriggerContext(trigger);
    lastFocusedElement = document.activeElement;
    modalForm.reset();
    setStatus(modalForm, "");
    setFormContext(modalForm, context);

    const messageField = modalForm.elements.message;
    if (messageField) {
      messageField.value = `Hello SELLAM, I would like to enquire about ${context.title}${context.location ? ` in ${context.location}` : ""}.`;
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("enquiry-modal-open");
    modalForm.querySelector("input[name='first_name']")?.focus({ preventScroll: true });
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("enquiry-modal-open");
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus({ preventScroll: true });
    }
  }

  function buildPayload(targetForm) {
    const formData = new FormData(targetForm);
    const values = {};
    formData.forEach((value, key) => {
      values[key] = String(value).trim();
    });

    const context = getPageContext();
    const fullName = values.name || [values.first_name, values.last_name].filter(Boolean).join(" ");

    return {
      name: fullName,
      email: values.email || "",
      phone: values.phone || "",
      message: values.message || "",
      property_id: values.property_id || context.propertyId,
      property_title: values.property_title || context.title,
      property_url: values.property_url || context.propertyUrl,
      listing_category: values.listing_category || context.listingCategory,
      source_page: values.source_page || context.sourcePage,
      website: values.website || ""
    };
  }

  async function submitToEndpoint(payload) {
    const response = await fetch(config.endpoint, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    let result = null;
    try {
      result = await response.json();
    } catch (_error) {
      result = null;
    }

    if (!response.ok || !result?.ok) {
      throw new Error(result?.error || "We could not send your enquiry. Please try again.");
    }

    return result;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const targetForm = event.currentTarget;
    if (!targetForm.reportValidity()) return;

    const submitButton = targetForm.querySelector("button[type='submit']");
    const originalLabel = submitButton?.textContent || "Submit";
    const payload = buildPayload(targetForm);

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }
    targetForm.setAttribute("aria-busy", "true");
    setStatus(targetForm, "Sending enquiry...");

    try {
      const result = await submitToEndpoint(payload);
      targetForm.reset();
      setStatus(targetForm, result.message || "Thank you. Your enquiry has been sent.", "success");

      if (targetForm.matches("[data-enquiry-form]")) {
        window.setTimeout(closeModal, 1600);
      }
    } catch (error) {
      setStatus(targetForm, error.message || "We could not send your enquiry. Please try again.", "error");
    } finally {
      targetForm.removeAttribute("aria-busy");
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
    }
  }

  function setupTriggers() {
    document.querySelectorAll("[data-enquiry-open], a").forEach((trigger) => {
      const isExplicit = trigger.hasAttribute("data-enquiry-open");
      const isEnquireLink = trigger.textContent.trim().toLowerCase() === "enquire";
      if (!isExplicit && !isEnquireLink) return;

      trigger.setAttribute("data-enquiry-open", "");
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        openModal(trigger);
      });
    });
  }

  function setupForm(targetForm) {
    prepareForm(targetForm);
    targetForm.addEventListener("submit", handleSubmit);
  }

  function setupEvents() {
    modal?.querySelector("[data-enquiry-close]")?.addEventListener("click", closeModal);
    modal?.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal?.classList.contains("is-open")) closeModal();
    });

    if (modalForm) setupForm(modalForm);
    document.querySelectorAll(".enquiry-form").forEach(setupForm);
  }

  document.addEventListener("DOMContentLoaded", () => {
    createModal();
    modal = document.querySelector("[data-enquiry-modal]");
    modalForm = modal?.querySelector("[data-enquiry-form]");
    setupTriggers();
    setupEvents();
  });
})();
