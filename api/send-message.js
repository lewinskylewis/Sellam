"use strict";

// Sends a dashboard reply as a real email — via Resend, from the selected
// Sellam mailbox address — and records it as an outbound email_messages row
// so the thread stays complete. Authenticated-admin only (see
// requireAuthenticatedAdmin in _messaging-shared.js): this route holds the
// service_role key and the Resend key, so it must never be reachable by an
// unauthenticated caller.
//
// Message-ID is generated here rather than left to Resend, so we control
// exactly what value ends up threaded: it's written into the outgoing
// email's own Message-ID header AND stored as this row's message_id, so
// when the recipient replies, their In-Reply-To/References will match it.
//
// Requires (Vercel → Project → Settings → Environment Variables):
//   SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_ANON_KEY, RESEND_API_KEY
//   — SUPABASE_ANON_KEY is the same publishable anon key already used by
//     admin/.env's VITE_SUPABASE_ANON_KEY; it is safe to duplicate here
//     because it's a public key by design, but Vercel Functions can't read
//     the admin app's Vite-time env, so it needs its own plain-named copy.

const { MAILBOXES, supabaseHeaders, requireEnv, requireAuthenticatedAdmin, applyCors } = require("./_messaging-shared");

const MAILBOX_DISPLAY_NAME = {
  sales: "SELLAM Sales",
  office: "SELLAM Office"
};

const USER_AGENT = "sellam-send-message/1.0";
const MAX_BODY_LENGTH = 20000;

function sendJson(response, status, payload) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  return response.status(status).json(payload);
}

async function readJsonBody(request) {
  if (request.body && typeof request.body === "object") return request.body;
  let raw = "";
  for await (const chunk of request) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

async function supabaseRequest(supabaseUrl, secretKey, path, init) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: { ...supabaseHeaders(secretKey, init.prefer), "User-Agent": USER_AGENT }
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase ${init.method || "GET"} ${path} failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  return response.status === 204 ? null : response.json();
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function generateMessageId() {
  const random = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return `<${random}@sellamre.com>`;
}

module.exports = async function sendMessageHandler(request, response) {
  if (applyCors(request, response)) return;

  if (request.method !== "POST") {
    return sendJson(response, 405, { ok: false, error: "Method not allowed." });
  }

  let admin;
  try {
    admin = await requireAuthenticatedAdmin(request);
  } catch (error) {
    return sendJson(response, error.statusCode || 401, { ok: false, error: error.message });
  }

  let body;
  try {
    body = await readJsonBody(request);
  } catch (_error) {
    return sendJson(response, 400, { ok: false, error: "Invalid JSON body." });
  }

  const conversationId = typeof body.conversationId === "string" ? body.conversationId.trim() : "";
  const bodyText = typeof body.bodyText === "string" ? body.bodyText.trim() : "";

  if (!conversationId) return sendJson(response, 400, { ok: false, error: "conversationId is required." });
  if (!bodyText) return sendJson(response, 400, { ok: false, error: "bodyText is required." });
  if (bodyText.length > MAX_BODY_LENGTH) {
    return sendJson(response, 400, { ok: false, error: "Message is too long." });
  }

  let supabaseUrl, supabaseSecretKey, resendApiKey;
  try {
    supabaseUrl = requireEnv("SUPABASE_URL").replace(/\/$/, "");
    supabaseSecretKey = requireEnv("SUPABASE_SECRET_KEY");
    resendApiKey = requireEnv("RESEND_API_KEY");
  } catch (error) {
    console.error("send-message configuration error:", error.message);
    return sendJson(response, 503, { ok: false, error: "Messaging is not configured yet." });
  }

  let conversation;
  try {
    const rows = await supabaseRequest(
      supabaseUrl,
      supabaseSecretKey,
      `/rest/v1/email_conversations?id=eq.${encodeURIComponent(conversationId)}&select=*`,
      { method: "GET" }
    );
    conversation = rows && rows[0];
  } catch (error) {
    console.error("send-message: failed to load conversation:", error.message);
    return sendJson(response, 502, { ok: false, error: "Could not load the conversation." });
  }

  if (!conversation) return sendJson(response, 404, { ok: false, error: "Conversation not found." });

  const mailboxAddress = MAILBOXES[conversation.mailbox];
  if (!mailboxAddress) {
    return sendJson(response, 500, { ok: false, error: `Unknown mailbox "${conversation.mailbox}" on this conversation.` });
  }

  let lastInboundMessageId = null;
  try {
    const priorMessages = await supabaseRequest(
      supabaseUrl,
      supabaseSecretKey,
      `/rest/v1/email_messages?conversation_id=eq.${encodeURIComponent(conversationId)}&select=message_id,direction&order=occurred_at.desc&limit=1`,
      { method: "GET" }
    );
    if (priorMessages && priorMessages[0]) lastInboundMessageId = priorMessages[0].message_id;
  } catch (error) {
    console.error("send-message: failed to load prior message for threading:", error.message);
  }

  const messageId = generateMessageId();
  const fromHeader = `${MAILBOX_DISPLAY_NAME[conversation.mailbox]} <${mailboxAddress}>`;
  const subject = conversation.subject
    ? conversation.subject.startsWith("Re:") ? conversation.subject : `Re: ${conversation.subject}`
    : "Re: Your message to SELLAM";

  const resendHeaders = { "Message-ID": messageId };
  if (lastInboundMessageId) {
    resendHeaders["In-Reply-To"] = lastInboundMessageId;
    resendHeaders["References"] = lastInboundMessageId;
  }

  let resendResult;
  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": messageId
      },
      body: JSON.stringify({
        from: fromHeader,
        to: [conversation.participant_email],
        subject,
        text: bodyText,
        html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#111;white-space:pre-wrap;">${escapeHtml(bodyText)}</div>`,
        headers: resendHeaders
      })
    });

    if (!resendResponse.ok) {
      const detail = await resendResponse.text().catch(() => "");
      throw new Error(`Resend send failed (${resendResponse.status}): ${detail.slice(0, 300)}`);
    }
    resendResult = await resendResponse.json();
  } catch (error) {
    console.error("send-message: Resend send failed:", error.message);
    return sendJson(response, 502, { ok: false, error: "Failed to send the email. Nothing was recorded." });
  }

  const occurredAt = new Date().toISOString();
  try {
    await supabaseRequest(supabaseUrl, supabaseSecretKey, "/rest/v1/email_messages", {
      method: "POST",
      prefer: "return=minimal",
      body: JSON.stringify({
        conversation_id: conversationId,
        direction: "outbound",
        message_id: messageId,
        in_reply_to: lastInboundMessageId,
        from_address: mailboxAddress,
        to_addresses: conversation.participant_email,
        subject,
        body_text: bodyText,
        body_html: null,
        occurred_at: occurredAt
      })
    });

    await supabaseRequest(supabaseUrl, supabaseSecretKey, `/rest/v1/email_conversations?id=eq.${encodeURIComponent(conversationId)}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: JSON.stringify({ last_message_at: occurredAt, is_read: true })
    });
  } catch (error) {
    // The email already went out — surface this clearly rather than silently
    // losing the record, since a retry here would send a duplicate email.
    console.error("send-message: sent via Resend but failed to record it:", error.message, "resendId:", resendResult?.id);
    return sendJson(response, 207, {
      ok: false,
      error: "The email was sent, but saving it to the conversation failed. Refresh and check for duplicates before retrying.",
      resendId: resendResult?.id
    });
  }

  return sendJson(response, 200, { ok: true, messageId, resendId: resendResult?.id, sentBy: admin?.email || null });
};
