(function () {
  const defaultConfig = {
    recipientEmail: "office@sellamc.com",
    endpoint: "",
    subjectPrefix: "SELLAM Property Enquiry"
  };

  const config = {
    ...defaultConfig,
    ...(window.SELLAM_ENQUIRY_CONFIG || {})
  };

  let modal;
  let form;
  let status;
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
          <input type="hidden" name="property" data-enquiry-property>
          <input type="hidden" name="page_url" data-enquiry-page>
          <div class="modal-field-row">
            <label>
              <span>First name</span>
              <input type="text" name="first_name" placeholder="John" autocomplete="given-name" required>
            </label>
            <label>
              <span>Last name</span>
              <input type="text" name="last_name" placeholder="Doe" autocomplete="family-name" required>
            </label>
          </div>
          <label>
            <span>Email address</span>
            <input type="email" name="email" placeholder="Example@Gmail.Com" autocomplete="email" required>
          </label>
          <label>
            <span>Message</span>
            <textarea name="message" placeholder="Message" required></textarea>
          </label>
          <p class="enquiry-status" data-enquiry-status aria-live="polite"></p>
          <button class="modal-enquiry-submit" type="submit">Submit</button>
        </form>
      </div>
    `;

    document.body.append(wrapper);
  }

  function getModalElements() {
    modal = document.querySelector("[data-enquiry-modal]");
    form = modal?.querySelector("[data-enquiry-form]");
    status = modal?.querySelector("[data-enquiry-status]");
  }

  function setStatus(message, type = "") {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-error", type === "error");
    status.classList.toggle("is-success", type === "success");
  }

  function getTriggerContext(trigger) {
    const card = trigger.closest("[data-card]");
    const title = trigger.dataset.property || card?.dataset.title || document.querySelector("[data-property-title]")?.textContent?.trim() || "SELLAM property";
    const location = trigger.dataset.location || card?.dataset.location || "";
    return { title, location };
  }

  function openModal(trigger) {
    if (!modal || !form) return;

    const context = getTriggerContext(trigger);
    lastFocusedElement = document.activeElement;
    form.reset();
    setStatus("");

    const propertyField = form.querySelector("[data-enquiry-property]");
    const pageField = form.querySelector("[data-enquiry-page]");
    const messageField = form.querySelector("textarea[name='message']");

    if (propertyField) propertyField.value = context.location ? `${context.title} - ${context.location}` : context.title;
    if (pageField) pageField.value = window.location.href;
    if (messageField) {
      messageField.value = `Hello SELLAM, I would like to enquire about ${context.title}${context.location ? ` in ${context.location}` : ""}.`;
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("enquiry-modal-open");
    form.querySelector("input[name='first_name']")?.focus({ preventScroll: true });
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

  function encodeMailto(payload) {
    const subject = `${config.subjectPrefix}: ${payload.property || "Website enquiry"}`;
    const body = [
      `First name: ${payload.first_name || ""}`,
      `Last name: ${payload.last_name || ""}`,
      `Name: ${payload.name || ""}`,
      `Phone: ${payload.phone || ""}`,
      `Email: ${payload.email || ""}`,
      `Property: ${payload.property || ""}`,
      `Page: ${payload.page_url || window.location.href}`,
      "",
      payload.message || ""
    ].join("\n");

    return `mailto:${encodeURIComponent(config.recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function buildPayload(targetForm) {
    const data = new FormData(targetForm);
    const payload = {};
    data.forEach((value, key) => {
      payload[key] = String(value).trim();
    });

    if (!payload.page_url) payload.page_url = window.location.href;
    if (!payload.property) {
      payload.property = document.querySelector("[data-property-title]")?.textContent?.trim() || document.title;
    }

    return payload;
  }

  async function submitToEndpoint(payload) {
    const data = new FormData();
    Object.entries(payload).forEach(([key, value]) => data.append(key, value));
    data.append("_subject", `${config.subjectPrefix}: ${payload.property || "Website enquiry"}`);
    data.append("_template", "table");
    data.append("_captcha", "false");

    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: data
    });

    if (!response.ok) {
      throw new Error("Enquiry endpoint rejected the request.");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const targetForm = event.currentTarget;
    const submitButton = targetForm.querySelector("button[type='submit']");
    const payload = buildPayload(targetForm);
    const isModalForm = targetForm.matches("[data-enquiry-form]");

    if (submitButton) submitButton.disabled = true;
    if (isModalForm) setStatus("Sending enquiry...");

    try {
      if (config.endpoint) {
        await submitToEndpoint(payload);
        if (isModalForm) {
          setStatus("Thank you. Your enquiry has been sent.", "success");
          window.setTimeout(closeModal, 1300);
        } else {
          targetForm.reset();
        }
      } else {
        window.location.href = encodeMailto(payload);
        if (isModalForm) setStatus("Your email draft is ready to send.", "success");
      }
    } catch (error) {
      window.location.href = encodeMailto(payload);
      if (isModalForm) {
        setStatus("Email service is unavailable. We opened an email draft instead.", "error");
      }
    } finally {
      if (submitButton) submitButton.disabled = false;
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

  function setupModalEvents() {
    modal?.querySelector("[data-enquiry-close]")?.addEventListener("click", closeModal);
    modal?.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });
    form?.addEventListener("submit", handleSubmit);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal?.classList.contains("is-open")) {
        closeModal();
      }
    });

    document.querySelectorAll(".enquiry-form").forEach((inlineForm) => {
      inlineForm.addEventListener("submit", handleSubmit);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    createModal();
    getModalElements();
    setupTriggers();
    setupModalEvents();
  });
})();
