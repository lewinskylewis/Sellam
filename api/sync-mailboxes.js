"use strict";

// Polls sales@sellamre.com and office@sellamre.com over IMAP and writes new
// messages into email_conversations / email_messages / email_attachments.
// Triggered on a schedule by Vercel Cron (see vercel.json's "crons" entry)
// and additionally callable on-demand from the dashboard's "Sync now"
// button — both paths are guarded, see _messaging-shared.js.
//
// Threading: a new message is attached to an existing conversation when its
// In-Reply-To (or any id in its References header) matches a message_id
// already stored; otherwise it starts a new conversation. This is why
// email_messages.message_id must be captured exactly as the mail server
// sent it, and why it's UNIQUE — re-running this sync must never duplicate
// a message it already has.
//
// Requires (Vercel → Project → Settings → Environment Variables):
//   SUPABASE_URL, SUPABASE_SECRET_KEY   — shared with /api/enquiry
//   TITAN_IMAP_HOST                     — e.g. imap.titan.email (ask GoDaddy/Titan support to confirm for this account if unsure)
//   TITAN_IMAP_PORT                     — e.g. 993 (IMAPS)
//   SALES_MAILBOX_PASSWORD              — sales@sellamre.com's mailbox password (ideally an app-specific password, not the account's main password)
//   OFFICE_MAILBOX_PASSWORD             — office@sellamre.com's mailbox password
//   CRON_SECRET                         — a random string only you and vercel.json's cron config know

const { ImapFlow } = require("imapflow");
const { simpleParser } = require("mailparser");
const { MAILBOXES, supabaseHeaders, requireEnv, requireAuthenticatedAdmin, isVercelCron, applyCors } = require("./_messaging-shared");

const MAX_MESSAGES_PER_SYNC = 50; // per mailbox, per run — keeps a first-ever sync (or a burst) from timing out the function
const USER_AGENT = "sellam-mailbox-sync/1.0";

function sendJson(response, status, payload) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  return response.status(status).json(payload);
}

async function supabaseRequest(config, path, init) {
  const response = await fetch(`${config.supabaseUrl}${path}`, {
    ...init,
    headers: { ...supabaseHeaders(config.supabaseKey, init.prefer), "User-Agent": USER_AGENT }
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase ${init.method || "GET"} ${path} failed (${response.status}): ${text.slice(0, 300)}`);
  }
  // PostgREST returns 201 with an EMPTY body for POST + Prefer: return=minimal
  // (only PATCH/return=minimal reliably uses 204) — checking status===204 alone
  // treated that empty 201 body as "has JSON", and response.json() on an empty
  // string throws, which previously aborted uploadAttachments()'s email_attachments
  // insert (and would have hit any other return=minimal POST here) even though
  // the row was actually written.
  return text ? JSON.parse(text) : null;
}

// Highest imap_uid already stored for this mailbox, so sync only asks IMAP
// for messages newer than what's already in Supabase.
async function highestKnownUid(config, mailbox) {
  const rows = await supabaseRequest(
    config,
    `/rest/v1/email_messages?select=imap_uid,email_conversations!inner(mailbox)&email_conversations.mailbox=eq.${mailbox}&direction=eq.inbound&imap_uid=not.is.null&order=imap_uid.desc&limit=1`,
    { method: "GET" }
  );
  return rows && rows[0] ? Number(rows[0].imap_uid) : 0;
}

// Best-effort: the most recent property_enquiries row from this exact email
// address, if any — soft-linked onto the new conversation, never written
// back to property_enquiries itself.
async function findRecentEnquiryId(config, email) {
  try {
    const rows = await supabaseRequest(
      config,
      `/rest/v1/property_enquiries?select=id&email=eq.${encodeURIComponent(email)}&order=submitted_at.desc&limit=1`,
      { method: "GET" }
    );
    return rows && rows[0] ? rows[0].id : null;
  } catch (_error) {
    return null; // never let this optional enrichment fail the sync
  }
}

function referencedMessageIds(parsed) {
  const ids = [];
  if (parsed.inReplyTo) ids.push(parsed.inReplyTo);
  if (parsed.references) {
    const refs = Array.isArray(parsed.references) ? parsed.references : [parsed.references];
    refs.forEach((r) => ids.push(r));
  }
  return ids.filter(Boolean);
}

// message_id is globally unique (see the email_messages schema), so once a
// message has been stored it can never legitimately need inserting again —
// but it CAN legitimately be re-encountered: a message can end up read from
// either monitored mailbox's own INBOX (e.g. a misdirected reply that lands
// in both), and highestKnownUid()'s cursor is scoped by the message's
// conversation.mailbox, not by which mailbox actually fetched it, so a
// later run of a different mailbox's sync can re-offer a UID this system
// already has. Checked before anything else touches the conversation, so
// re-seeing an already-known message can never mark an old, already-read
// conversation unread again.
async function messageExists(config, messageId) {
  const rows = await supabaseRequest(
    config,
    `/rest/v1/email_messages?select=id&message_id=eq.${encodeURIComponent(messageId)}&limit=1`,
    { method: "GET" }
  );
  return Boolean(rows && rows[0]);
}

async function findConversationByReferences(config, ids) {
  if (!ids.length) return null;
  const orClause = ids.map((id) => `message_id.eq.${encodeURIComponent(id)}`).join(",");
  const rows = await supabaseRequest(
    config,
    `/rest/v1/email_messages?select=conversation_id&or=(${orClause})&limit=1`,
    { method: "GET" }
  );
  return rows && rows[0] ? rows[0].conversation_id : null;
}

// The public enquiry form's own notification email (api/enquiry.js's
// sendNotification) is sent FROM a shared Sellam address (RESEND_FROM_EMAIL,
// e.g. office@sellamre.com) but sets Reply-To to the actual customer's
// address, exactly so replies reach the customer. When that first
// notification lands in a monitored mailbox and starts a new conversation
// here, using its raw From address as the "participant" makes the
// conversation's customer look like office@sellamre.com instead of the real
// customer — every reply then goes to the wrong place. Preferring a
// Reply-To that differs from From fixes this for that one case while
// leaving every genuine customer-initiated email (no such mismatch) using
// From exactly as before.
function participantFromMessage(parsed) {
  const from = parsed.from?.value?.[0];
  const replyTo = parsed.replyTo?.value?.[0];
  if (replyTo?.address && replyTo.address.toLowerCase() !== (from?.address || "").toLowerCase()) {
    return { address: replyTo.address, name: replyTo.name || from?.name || null };
  }
  return { address: from?.address || "", name: from?.name || null };
}

async function createConversation(config, mailboxKey, parsed) {
  const participant = participantFromMessage(parsed);
  const enquiryId = await findRecentEnquiryId(config, participant.address);

  const rows = await supabaseRequest(config, "/rest/v1/email_conversations", {
    method: "POST",
    prefer: "return=representation",
    body: JSON.stringify({
      mailbox: mailboxKey,
      subject: parsed.subject || "(no subject)",
      participant_email: participant.address,
      participant_name: participant.name,
      enquiry_id: enquiryId,
      last_message_at: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
      is_read: false
    })
  });
  return rows[0].id;
}

async function insertMessage(config, conversationId, uid, parsed) {
  const toAddresses = (parsed.to?.value || []).map((t) => t.address).join(", ");
  const rows = await supabaseRequest(config, "/rest/v1/email_messages", {
    method: "POST",
    prefer: "return=representation",
    body: JSON.stringify({
      conversation_id: conversationId,
      direction: "inbound",
      message_id: parsed.messageId,
      in_reply_to: parsed.inReplyTo || null,
      from_address: parsed.from?.value?.[0]?.address || "",
      to_addresses: toAddresses,
      subject: parsed.subject || "",
      body_text: parsed.text || null,
      body_html: parsed.html || null,
      imap_uid: uid,
      occurred_at: parsed.date ? parsed.date.toISOString() : new Date().toISOString()
    })
  });
  return rows[0].id;
}

async function touchConversation(config, conversationId, occurredAt) {
  await supabaseRequest(config, `/rest/v1/email_conversations?id=eq.${conversationId}`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: JSON.stringify({ last_message_at: occurredAt, is_read: false })
  });
}

async function uploadAttachments(config, conversationId, messageId, attachments) {
  for (const attachment of attachments) {
    const safeName = String(attachment.filename || "attachment").replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${conversationId}/${messageId}/${Date.now()}-${safeName}`;

    const uploadResponse = await fetch(
      `${config.supabaseUrl}/storage/v1/object/message-attachments/${storagePath}`,
      {
        method: "POST",
        headers: {
          apikey: config.supabaseKey,
          Authorization: `Bearer ${config.supabaseKey}`,
          "Content-Type": attachment.contentType || "application/octet-stream"
        },
        body: attachment.content
      }
    );
    if (!uploadResponse.ok) {
      console.error("Attachment upload failed:", attachment.filename, uploadResponse.status);
      continue; // one bad attachment must not lose the message it belongs to
    }

    await supabaseRequest(config, "/rest/v1/email_attachments", {
      method: "POST",
      prefer: "return=minimal",
      body: JSON.stringify({
        message_id: messageId,
        filename: attachment.filename || "attachment",
        content_type: attachment.contentType || null,
        size_bytes: attachment.size || attachment.content?.length || null,
        storage_path: storagePath
      })
    });
  }
}

async function syncMailbox(config, mailboxKey, address, password) {
  const client = new ImapFlow({
    host: config.imapHost,
    port: config.imapPort,
    secure: true,
    auth: { user: address, pass: password },
    logger: false
  });

  let processed = 0;
  let skipped = 0;
  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const sinceUid = await highestKnownUid(config, mailboxKey);
      // uid range "(sinceUid+1):*" — IMAP UIDs are strictly increasing and
      // never reused within a mailbox, which is exactly why they're used as
      // the resume cursor instead of a date or sequence number.
      const range = `${sinceUid + 1}:*`;

      for await (const message of client.fetch(range, { uid: true, source: true }, { uid: true })) {
        if (processed + skipped >= MAX_MESSAGES_PER_SYNC) break;
        if (sinceUid > 0 && message.uid <= sinceUid) continue; // "*" can re-include the last known UID

        const parsed = await simpleParser(message.source);
        if (!parsed.messageId) continue; // can't thread or dedupe without one — skip rather than guess

        // Idempotency: already synced (possibly by another mailbox's run —
        // see messageExists()'s comment) — not an error, nothing new to do.
        if (await messageExists(config, parsed.messageId)) {
          skipped += 1;
          continue;
        }

        const refs = referencedMessageIds(parsed);
        let conversationId = await findConversationByReferences(config, refs);
        if (!conversationId) {
          conversationId = await createConversation(config, mailboxKey, parsed);
        } else {
          await touchConversation(config, conversationId, parsed.date ? parsed.date.toISOString() : new Date().toISOString());
        }

        const messageRowId = await insertMessage(config, conversationId, message.uid, parsed);
        if (parsed.attachments?.length) {
          await uploadAttachments(config, conversationId, messageRowId, parsed.attachments);
        }
        processed += 1;
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
  return processed;
}

module.exports = async function syncMailboxesHandler(request, response) {
  if (applyCors(request, response)) return;

  if (!isVercelCron(request)) {
    try {
      await requireAuthenticatedAdmin(request);
    } catch (error) {
      return sendJson(response, error.statusCode || 401, { ok: false, error: error.message });
    }
  }

  let config;
  try {
    config = {
      supabaseUrl: requireEnv("SUPABASE_URL").replace(/\/$/, ""),
      supabaseKey: requireEnv("SUPABASE_SECRET_KEY"),
      imapHost: requireEnv("TITAN_IMAP_HOST"),
      imapPort: Number(process.env.TITAN_IMAP_PORT || 993)
    };
  } catch (error) {
    console.error("Mailbox sync configuration error:", error.message);
    return sendJson(response, 503, { ok: false, error: "Mailbox sync is not configured yet." });
  }

  const results = {};
  for (const [key, address] of Object.entries(MAILBOXES)) {
    const passwordEnvVar = key === "sales" ? "SALES_MAILBOX_PASSWORD" : "OFFICE_MAILBOX_PASSWORD";
    const password = process.env[passwordEnvVar];
    if (!password) {
      results[key] = { ok: false, error: `${passwordEnvVar} is not set.` };
      continue;
    }
    try {
      const count = await syncMailbox(config, key, address, password);
      results[key] = { ok: true, newMessages: count };
    } catch (error) {
      // Only specific, known-safe diagnostic fields — never the whole error
      // object or anything from `config`/the auth options, since ImapFlow
      // errors are not guaranteed not to carry connection context.
      console.error(`Mailbox sync failed for ${address}:`, {
        mailbox: key,
        name: error?.name,
        message: error?.message,
        code: error?.code,
        response: error?.response,
        responseCode: error?.responseCode,
        command: error?.command,
        stack: error?.stack
      });
      results[key] = { ok: false, error: error.message };
    }
  }

  return sendJson(response, 200, { ok: true, results });
};
