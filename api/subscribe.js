"use strict";

const MAX_REQUEST_BYTES = 4 * 1024;
const USER_AGENT = "sellam-newsletter-subscribers/1.0";

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

function stripControlCharacters(value) {
  let result = "";
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    result += code <= 31 || code === 127 ? " " : value[i];
  }
  return result;
}

function normalizeSingleLine(value) {
  return stripControlCharacters(String(value ?? "").normalize("NFKC"))
    .replace(/\s+/g, " ")
    .trim();
}

function isEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);
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
  const subscriber = {
    email: normalizeSingleLine(raw.email).toLowerCase(),
    source_page: normalizeSingleLine(raw.source_page)
  };

  const fields = {};
  if (!isEmail(subscriber.email)) fields.email = "Enter a valid email address.";
  if (!isHttpUrl(subscriber.source_page)) fields.source_page = "Source page is invalid.";

  return { subscriber, fields, valid: Object.keys(fields).length === 0 };
}

function validateEnvironment() {
  const config = {
    supabaseUrl: String(process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    supabaseKey: String(process.env.SUPABASE_SECRET_KEY || ""),
    resendKey: String(process.env.RESEND_API_KEY || ""),
    resendFrom: String(process.env.RESEND_FROM_EMAIL || ""),
    recipients: String(process.env.NEWSLETTER_RECIPIENT_EMAIL || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  };

  const validSupabaseUrl = isHttpUrl(config.supabaseUrl) && config.supabaseUrl.startsWith("https://");
  const validRecipients = config.recipients.length > 0 && config.recipients.every(isEmail);
  const fromAddress = config.resendFrom.match(/<([^>]+)>/)?.[1] || config.resendFrom;

  if (!validSupabaseUrl || !config.supabaseKey || !config.resendKey || !isEmail(fromAddress) || !validRecipients) {
    throw new Error("Newsletter service environment variables are incomplete or invalid.");
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

async function upsertSubscriber(config, subscriber) {
  // on_conflict=email + merge-duplicates makes this idempotent: resubscribing
  // (or double-clicking Submit) updates the existing row instead of erroring.
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/newsletter_subscribers?on_conflict=email`,
    {
      method: "POST",
      headers: supabaseHeaders(config.supabaseKey, "resolution=merge-duplicates,return=representation"),
      body: JSON.stringify({ ...subscriber, status: "new" })
    }
  );

  if (!response.ok) {
    throw new ExternalServiceError("Supabase", response.status, await responseDetail(response));
  }

  const rows = await response.json();
  const record = Array.isArray(rows) ? rows[0] : rows;
  if (!record?.id) throw new ExternalServiceError("Supabase", 502, "Upsert response did not contain an id.");
  return record;
}

async function updateSubscriberStatus(config, id, status) {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/newsletter_subscribers?id=eq.${encodeURIComponent(id)}`,
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

function buildTeamNotification(subscriber, recordId) {
  const text = [
    "New SELLAM newsletter subscriber",
    "",
    `Email: ${subscriber.email}`,
    `Source page: ${subscriber.source_page}`,
    `Subscriber ID: ${recordId}`
  ].join("\n");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#122c35;line-height:1.5">
      <h1 style="font-size:22px;margin:0 0 18px">New newsletter subscriber</h1>
      <p style="margin:0 0 6px"><strong>Email:</strong> ${escapeHtml(subscriber.email)}</p>
      <p style="margin:0 0 6px"><strong>Source page:</strong> ${escapeHtml(subscriber.source_page)}</p>
      <p style="margin:0"><strong>Subscriber ID:</strong> ${escapeHtml(recordId)}</p>
    </div>
  `;

  return { html, text };
}

function buildWelcomeEmail() {
  const text = [
    "Thank you for subscribing to the SELLAM newsletter.",
    "",
    "You'll receive updates on new listings, off-market opportunities, and real estate insights from SELLAM.",
    "",
    "If you did not request this, you can ignore this email.",
    "",
    "SELLAM | office@sellamre.com"
  ].join("\n");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#122c35;line-height:1.6">
      <h1 style="font-size:22px;margin:0 0 18px">Welcome to the SELLAM newsletter</h1>
      <p style="margin:0 0 14px">Thank you for subscribing. You'll receive updates on new listings, off-market opportunities, and real estate insights from SELLAM.</p>
      <p style="margin:0 0 14px">If you did not request this, you can safely ignore this email.</p>
      <p style="margin:0;color:#5b6b70">SELLAM &middot; office@sellamre.com</p>
    </div>
  `;

  return { html, text };
}

async function sendEmail(config, { to, subject, content, replyTo, idempotencyKey }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
      "User-Agent": USER_AGENT
    },
    body: JSON.stringify({
      from: config.resendFrom,
      to,
      subject,
      html: content.html,
      text: content.text,
      ...(replyTo ? { reply_to: replyTo } : {})
    })
  });

  if (!response.ok) {
    throw new ExternalServiceError("Resend", response.status, await responseDetail(response));
  }
}

module.exports = async function subscribeHandler(request, response) {
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
    return sendJson(response, 200, { ok: true, message: "Thank you for subscribing." });
  }

  const validation = validatePayload(body);
  if (!validation.valid) {
    return sendJson(response, 400, {
      ok: false,
      error: "Enter a valid email address.",
      fields: validation.fields
    });
  }

  let config;
  try {
    config = validateEnvironment();
  } catch (error) {
    console.error("Newsletter configuration error:", error.message);
    return sendJson(response, 503, { ok: false, error: "The newsletter service is temporarily unavailable." });
  }

  let record;
  try {
    record = await upsertSubscriber(config, validation.subscriber);
  } catch (error) {
    console.error("Newsletter storage error:", error.service || error.name, error.status || "", error.detail || "");
    return sendJson(response, 503, { ok: false, error: "We could not save your subscription. Please try again." });
  }

  try {
    await sendEmail(config, {
      to: config.recipients,
      subject: `New newsletter subscriber: ${validation.subscriber.email}`.slice(0, 200),
      content: buildTeamNotification(validation.subscriber, record.id),
      replyTo: validation.subscriber.email,
      idempotencyKey: `sellam-newsletter-team/${record.id}`
    });

    // The welcome email is a nice-to-have — its failure must not undo a
    // successful subscription or block the team notification above.
    try {
      await sendEmail(config, {
        to: [validation.subscriber.email],
        subject: "Welcome to the SELLAM newsletter",
        content: buildWelcomeEmail(),
        idempotencyKey: `sellam-newsletter-welcome/${record.id}`
      });
    } catch (welcomeError) {
      console.error(
        "Newsletter welcome email error:",
        welcomeError.service || welcomeError.name,
        welcomeError.status || "",
        welcomeError.detail || ""
      );
    }

    try {
      await updateSubscriberStatus(config, record.id, "notified");
    } catch (statusError) {
      console.error("Newsletter status update error:", statusError.status || "", statusError.detail || "");
    }
  } catch (error) {
    console.error("Newsletter notification error:", error.service || error.name, error.status || "", error.detail || "");
    try {
      await updateSubscriberStatus(config, record.id, "email_failed");
    } catch (statusError) {
      console.error("Newsletter failure-status update error:", statusError.status || "", statusError.detail || "");
    }

    // The subscriber is safely stored, so do not encourage a duplicate submission.
    return sendJson(response, 202, {
      ok: true,
      subscriberId: record.id,
      message: "Thank you for subscribing."
    });
  }

  return sendJson(response, 201, {
    ok: true,
    subscriberId: record.id,
    message: "Thank you for subscribing. Check your inbox for a welcome email."
  });
};
