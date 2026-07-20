"use strict";

const MAX_REQUEST_BYTES = 16 * 1024;
const USER_AGENT = "sellam-property-enquiries/1.0";

class ExternalServiceError extends Error {
  constructor(service, status, detail) {
    super(`${service} request failed with status ${status}.`);
    this.name = "ExternalServiceError";
    this.service = service;
    this.status = status;
    this.detail = detail;
  }
}

function sendJson(response, status, payload) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("X-Content-Type-Options", "nosniff");
  return response.status(status).json(payload);
}

function header(request, name) {
  const value = request.headers?.[name] ?? request.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function parseBody(request) {
  if (request.body == null) return {};
  if (Buffer.isBuffer(request.body)) return JSON.parse(request.body.toString("utf8"));
  if (typeof request.body === "string") return JSON.parse(request.body);
  if (typeof request.body === "object" && !Array.isArray(request.body)) return request.body;
  throw new TypeError("Request body must be a JSON object.");
}

function normalizeSingleLine(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeMessage(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function isEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);
}

function isPhone(value) {
  const digits = value.replace(/\D/g, "");
  return /^[+\d][\d\s().-]*$/.test(value) && digits.length >= 7 && digits.length <= 15;
}

function isHttpUrl(value) {
  if (!value || value.length > 2048) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch (_error) {
    return false;
  }
}

function validatePayload(raw) {
  const enquiry = {
    name: normalizeSingleLine(raw.name),
    email: normalizeSingleLine(raw.email).toLowerCase(),
    phone: normalizeSingleLine(raw.phone),
    message: normalizeMessage(raw.message),
    property_id: normalizeSingleLine(raw.property_id),
    property_title: normalizeSingleLine(raw.property_title),
    property_url: normalizeSingleLine(raw.property_url),
    listing_category: normalizeSingleLine(raw.listing_category).toLowerCase(),
    source_page: normalizeSingleLine(raw.source_page)
  };

  const fields = {};
  if (enquiry.name.length < 2 || enquiry.name.length > 120) fields.name = "Enter a name between 2 and 120 characters.";
  if (!isEmail(enquiry.email)) fields.email = "Enter a valid email address.";
  if (enquiry.phone.length > 40 || !isPhone(enquiry.phone)) fields.phone = "Enter a valid phone number.";
  if (enquiry.message.length < 10 || enquiry.message.length > 4000) fields.message = "Enter a message between 10 and 4000 characters.";
  if (!/^[a-z0-9][a-z0-9._:-]{0,119}$/i.test(enquiry.property_id)) fields.property_id = "Property information is missing.";
  if (enquiry.property_title.length < 1 || enquiry.property_title.length > 200) fields.property_title = "Property information is missing.";
  if (!isHttpUrl(enquiry.property_url)) fields.property_url = "Property URL is invalid.";
  if (!/^[a-z0-9][a-z0-9 _&/-]{0,79}$/i.test(enquiry.listing_category)) fields.listing_category = "Listing category is invalid.";
  if (!isHttpUrl(enquiry.source_page)) fields.source_page = "Source page is invalid.";

  return { enquiry, fields, valid: Object.keys(fields).length === 0 };
}

function validateEnvironment() {
  const config = {
    supabaseUrl: String(process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    supabaseKey: String(process.env.SUPABASE_SECRET_KEY || ""),
    resendKey: String(process.env.RESEND_API_KEY || ""),
    resendFrom: String(process.env.RESEND_FROM_EMAIL || ""),
    recipients: String(process.env.ENQUIRY_RECIPIENT_EMAIL || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  };

  const validSupabaseUrl = isHttpUrl(config.supabaseUrl) && config.supabaseUrl.startsWith("https://");
  const validRecipients = config.recipients.length > 0 && config.recipients.every(isEmail);
  const fromAddress = config.resendFrom.match(/<([^>]+)>/)?.[1] || config.resendFrom;

  if (!validSupabaseUrl || !config.supabaseKey || !config.resendKey || !isEmail(fromAddress) || !validRecipients) {
    throw new Error("Enquiry service environment variables are incomplete or invalid.");
  }

  return config;
}

function isSameOriginRequest(request) {
  const origin = header(request, "origin");
  if (!origin) return true;

  const forwardedHost = String(header(request, "x-forwarded-host") || header(request, "host") || "")
    .split(",")[0]
    .trim()
    .toLowerCase();

  try {
    return Boolean(forwardedHost) && new URL(origin).host.toLowerCase() === forwardedHost;
  } catch (_error) {
    return false;
  }
}

async function responseDetail(response) {
  try {
    return (await response.text()).slice(0, 500);
  } catch (_error) {
    return "";
  }
}

function supabaseHeaders(secretKey, prefer) {
  return {
    apikey: secretKey,
    "Content-Type": "application/json",
    Prefer: prefer,
    "User-Agent": USER_AGENT
  };
}

async function insertEnquiry(config, enquiry) {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/property_enquiries`, {
    method: "POST",
    headers: supabaseHeaders(config.supabaseKey, "return=representation"),
    body: JSON.stringify({ ...enquiry, status: "new" })
  });

  if (!response.ok) {
    throw new ExternalServiceError("Supabase", response.status, await responseDetail(response));
  }

  const rows = await response.json();
  const record = Array.isArray(rows) ? rows[0] : rows;
  if (!record?.id) throw new ExternalServiceError("Supabase", 502, "Insert response did not contain an id.");
  return record;
}

async function updateEnquiryStatus(config, id, status) {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/property_enquiries?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: supabaseHeaders(config.supabaseKey, "return=minimal"),
      body: JSON.stringify({ status })
    }
  );

  if (!response.ok) {
    throw new ExternalServiceError("Supabase", response.status, await responseDetail(response));
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildEmail(enquiry, recordId) {
  const fields = [
    ["Name", enquiry.name],
    ["Email", enquiry.email],
    ["Phone", enquiry.phone],
    ["Property ID", enquiry.property_id],
    ["Property", enquiry.property_title],
    ["Listing category", enquiry.listing_category],
    ["Property URL", enquiry.property_url],
    ["Source page", enquiry.source_page],
    ["Enquiry ID", recordId]
  ];

  const text = [
    "New SELLAM property enquiry",
    "",
    ...fields.map(([label, value]) => `${label}: ${value}`),
    "",
    "Message:",
    enquiry.message
  ].join("\n");

  const rows = fields
    .map(([label, value]) => `<tr><th align="left" style="padding:6px 14px 6px 0;vertical-align:top">${escapeHtml(label)}</th><td style="padding:6px 0">${escapeHtml(value)}</td></tr>`)
    .join("");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#122c35;line-height:1.5">
      <h1 style="font-size:22px;margin:0 0 18px">New SELLAM property enquiry</h1>
      <table style="border-collapse:collapse">${rows}</table>
      <h2 style="font-size:17px;margin:22px 0 8px">Message</h2>
      <p style="white-space:pre-wrap;margin:0">${escapeHtml(enquiry.message)}</p>
    </div>
  `;

  return { html, text };
}

async function sendNotification(config, enquiry, recordId) {
  const content = buildEmail(enquiry, recordId);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `sellam-enquiry/${recordId}`,
      "User-Agent": USER_AGENT
    },
    body: JSON.stringify({
      from: config.resendFrom,
      to: config.recipients,
      subject: `Property enquiry: ${enquiry.property_title}`.slice(0, 200),
      html: content.html,
      text: content.text,
      reply_to: enquiry.email
    })
  });

  if (!response.ok) {
    throw new ExternalServiceError("Resend", response.status, await responseDetail(response));
  }
}

module.exports = async function enquiryHandler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { ok: false, error: "Method not allowed." });
  }

  const contentLength = Number(header(request, "content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return sendJson(response, 413, { ok: false, error: "Request is too large." });
  }

  const contentType = String(header(request, "content-type") || "").toLowerCase();
  if (!contentType.includes("application/json")) {
    return sendJson(response, 415, { ok: false, error: "Content-Type must be application/json." });
  }

  if (!isSameOriginRequest(request)) {
    return sendJson(response, 403, { ok: false, error: "Request origin is not allowed." });
  }

  let body;
  try {
    body = parseBody(request);
  } catch (_error) {
    return sendJson(response, 400, { ok: false, error: "Invalid JSON request body." });
  }

  // Honeypot: bots receive a normal success response but nothing is stored or sent.
  if (normalizeSingleLine(body.website)) {
    return sendJson(response, 200, { ok: true, message: "Your enquiry has been received." });
  }

  const validation = validatePayload(body);
  if (!validation.valid) {
    return sendJson(response, 400, {
      ok: false,
      error: "Please check the highlighted enquiry details.",
      fields: validation.fields
    });
  }

  let config;
  try {
    config = validateEnvironment();
  } catch (error) {
    console.error("Enquiry configuration error:", error.message);
    return sendJson(response, 503, { ok: false, error: "The enquiry service is temporarily unavailable." });
  }

  let record;
  try {
    record = await insertEnquiry(config, validation.enquiry);
  } catch (error) {
    console.error("Enquiry storage error:", error.service || error.name, error.status || "", error.detail || "");
    return sendJson(response, 503, { ok: false, error: "We could not save your enquiry. Please try again." });
  }

  try {
    await sendNotification(config, validation.enquiry, record.id);
    try {
      await updateEnquiryStatus(config, record.id, "notified");
    } catch (statusError) {
      console.error("Enquiry status update error:", statusError.status || "", statusError.detail || "");
    }
  } catch (error) {
    console.error("Enquiry notification error:", error.service || error.name, error.status || "", error.detail || "");
    try {
      await updateEnquiryStatus(config, record.id, "email_failed");
    } catch (statusError) {
      console.error("Enquiry failure-status update error:", statusError.status || "", statusError.detail || "");
    }

    // The lead is safely stored, so do not encourage a duplicate submission.
    return sendJson(response, 202, {
      ok: true,
      enquiryId: record.id,
      message: "Your enquiry has been received."
    });
  }

  return sendJson(response, 201, {
    ok: true,
    enquiryId: record.id,
    message: "Thank you. Your enquiry has been sent."
  });
};
