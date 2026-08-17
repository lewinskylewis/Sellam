(function () {
  const endpoint = "/api/subscribe";

  function hideVisually(element) {
    element.style.position = "absolute";
    element.style.width = "1px";
    element.style.height = "1px";
    element.style.margin = "-1px";
    element.style.padding = "0";
    element.style.overflow = "hidden";
    element.style.clip = "rect(0 0 0 0)";
    element.style.whiteSpace = "nowrap";
    element.style.border = "0";
  }

  function setStatus(form, message, type) {
    let status = form.querySelector("[data-newsletter-status]");
    if (!status) {
      status = document.createElement("p");
      status.dataset.newsletterStatus = "";
      status.setAttribute("aria-live", "polite");
      status.style.margin = "10px 0 0";
      status.style.fontSize = "13px";
      form.append(status);
    }
    status.textContent = message;
    status.style.color = type === "error"
      ? "#ff9b9b"
      : type === "success"
        ? "#9fd8b0"
        : "rgba(255, 255, 255, 0.75)";
  }

  function prepareForm(form) {
    if (form.dataset.newsletterPrepared === "true") return;
    form.dataset.newsletterPrepared = "true";

    const honeypot = document.createElement("input");
    honeypot.type = "text";
    honeypot.name = "website";
    honeypot.autocomplete = "off";
    honeypot.tabIndex = -1;
    honeypot.setAttribute("aria-hidden", "true");
    hideVisually(honeypot);
    form.prepend(honeypot);
  }

  async function submitSubscription(email, website) {
    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        website,
        source_page: window.location.href
      })
    });

    let result = null;
    try {
      result = await response.json();
    } catch (_error) {
      result = null;
    }

    if (!response.ok || !result?.ok) {
      throw new Error(result?.error || "We could not subscribe you. Please try again.");
    }

    return result;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const emailInput = form.querySelector('input[type="email"]');
    const email = emailInput ? emailInput.value.trim() : "";
    const website = form.querySelector('input[name="website"]')?.value || "";
    const submitButton = form.querySelector("button[type='submit']");
    const originalLabel = submitButton?.textContent || "Submit";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }
    form.setAttribute("aria-busy", "true");
    setStatus(form, "Subscribing...");

    try {
      const result = await submitSubscription(email, website);
      form.reset();
      setStatus(form, result.message || "Thank you for subscribing.", "success");
    } catch (error) {
      setStatus(form, error.message || "We could not subscribe you. Please try again.", "error");
    } finally {
      form.removeAttribute("aria-busy");
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
    }
  }

  function init() {
    document.querySelectorAll(".footer-subscribe form").forEach((form) => {
      prepareForm(form);
      form.addEventListener("submit", handleSubmit);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
