import { supabase } from "./supabase";

// Matches public.email_conversations / email_messages / email_attachments
// (supabase/migrations/202608280001_create_email_messaging.sql). Real email
// threads for sales@sellamre.com and office@sellamre.com, synced by
// /api/sync-mailboxes over IMAP and replied to via /api/send-message
// (Resend) — never a Supabase-only chat log.

export type Mailbox = "sales" | "office";

export const MAILBOX_ADDRESSES: Record<Mailbox, string> = {
  sales: "sales@sellamre.com",
  office: "office@sellamre.com",
};

export const MAILBOX_LABELS: Record<Mailbox, string> = {
  sales: "Sales",
  office: "Office",
};

export type EmailConversation = {
  id: string;
  mailbox: Mailbox;
  subject: string;
  participant_email: string;
  participant_name: string | null;
  enquiry_id: number | null;
  last_message_at: string;
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  created_at: string;
};

export type EmailAttachment = {
  id: string;
  message_id: string;
  filename: string;
  content_type: string | null;
  size_bytes: number | null;
  storage_path: string;
};

export type EmailMessage = {
  id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  message_id: string;
  in_reply_to: string | null;
  from_address: string;
  to_addresses: string;
  subject: string;
  body_text: string | null;
  body_html: string | null;
  occurred_at: string;
  attachments?: EmailAttachment[];
};

const CONVERSATION_COLUMNS =
  "id, mailbox, subject, participant_email, participant_name, enquiry_id, last_message_at, is_read, is_starred, is_archived, created_at";

export async function fetchConversations(): Promise<EmailConversation[]> {
  const { data, error } = await supabase
    .from("email_conversations")
    .select(CONVERSATION_COLUMNS)
    .order("last_message_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchMessagesForConversation(conversationId: string): Promise<EmailMessage[]> {
  const { data: messages, error: messagesError } = await supabase
    .from("email_messages")
    .select("id, conversation_id, direction, message_id, in_reply_to, from_address, to_addresses, subject, body_text, body_html, occurred_at")
    .eq("conversation_id", conversationId)
    .order("occurred_at", { ascending: true });
  if (messagesError) throw messagesError;
  if (!messages || messages.length === 0) return [];

  const { data: attachments, error: attachmentsError } = await supabase
    .from("email_attachments")
    .select("id, message_id, filename, content_type, size_bytes, storage_path")
    .in("message_id", messages.map((m) => m.id));
  if (attachmentsError) throw attachmentsError;

  const attachmentsByMessageId = new Map<string, EmailAttachment[]>();
  (attachments ?? []).forEach((a) => {
    const existing = attachmentsByMessageId.get(a.message_id) ?? [];
    existing.push(a);
    attachmentsByMessageId.set(a.message_id, existing);
  });

  return messages.map((m) => ({ ...m, attachments: attachmentsByMessageId.get(m.id) ?? [] }));
}

// message-attachments is a private bucket (customer documents, not
// marketing photos) — a public URL would 400 with no auth, so this signs a
// short-lived URL under the current admin session instead.
export async function attachmentSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from("message-attachments").createSignedUrl(storagePath, 300);
  if (error) throw error;
  return data.signedUrl;
}

export async function setConversationRead(id: string, isRead: boolean): Promise<void> {
  const { error } = await supabase.from("email_conversations").update({ is_read: isRead }).eq("id", id);
  if (error) throw error;
}

export async function setConversationStarred(id: string, isStarred: boolean): Promise<void> {
  const { error } = await supabase.from("email_conversations").update({ is_starred: isStarred }).eq("id", id);
  if (error) throw error;
}

export async function setConversationArchived(id: string, isArchived: boolean): Promise<void> {
  const { error } = await supabase.from("email_conversations").update({ is_archived: isArchived }).eq("id", id);
  if (error) throw error;
}

// api/send-message.js and api/sync-mailboxes.js hold the service_role and
// Resend keys, so they can't be reached with the browser's anon Supabase
// client — these two calls go straight to the Vercel Functions instead,
// authenticated with the signed-in admin's own Supabase session token
// (verified server-side via requireAuthenticatedAdmin).
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

async function callMessagingApi(path: string, accessToken: string, body?: unknown): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || `Request to ${path} failed (${response.status}).`);
  }
  return payload;
}

export async function sendReply(accessToken: string, conversationId: string, bodyText: string): Promise<void> {
  await callMessagingApi("/api/send-message", accessToken, { conversationId, bodyText });
}

export async function triggerMailboxSync(accessToken: string): Promise<Record<string, { ok: boolean; newMessages?: number; error?: string }>> {
  const result = (await callMessagingApi("/api/sync-mailboxes", accessToken)) as {
    results: Record<string, { ok: boolean; newMessages?: number; error?: string }>;
  };
  return result.results;
}
