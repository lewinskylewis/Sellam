import { useEffect, useMemo, useState } from "react";
import Avatar from "../components/Avatar";
import { useAuth } from "../lib/auth";
import {
  ArchiveIcon,
  CloseIcon,
  MailIcon,
  PaperclipIcon,
  RefreshIcon,
  SearchIcon,
  SendIcon,
  StarIcon,
} from "../components/icons";
import {
  MAILBOX_LABELS,
  attachmentSignedUrl,
  fetchConversations,
  fetchMessagesForConversation,
  sendReply,
  setConversationArchived,
  setConversationRead,
  setConversationStarred,
  triggerMailboxSync,
  type EmailConversation,
  type EmailMessage,
  type Mailbox,
} from "../lib/messages";

type StatusFilter = "all" | "unread" | "starred" | "archived";

const selectClasses =
  "rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand";

function formatListDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mailboxBadgeClasses(mailbox: Mailbox) {
  return mailbox === "sales" ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700";
}

function AttachmentPill({ filename, storagePath }: { filename: string; storagePath: string }) {
  const [opening, setOpening] = useState(false);

  async function open() {
    setOpening(true);
    try {
      const url = await attachmentSignedUrl(storagePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // best-effort — nothing to recover into, the click simply does nothing
    } finally {
      setOpening(false);
    }
  }

  return (
    <button
      type="button"
      onClick={open}
      disabled={opening}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink-soft hover:border-brand hover:text-brand disabled:opacity-60"
    >
      <PaperclipIcon className="h-3.5 w-3.5" />
      {filename}
    </button>
  );
}

export default function Messages() {
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;

  const [conversations, setConversations] = useState<EmailConversation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [mailboxFilter, setMailboxFilter] = useState<"all" | Mailbox>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<EmailMessage[] | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  function loadConversations() {
    setLoading(true);
    setError(null);
    fetchConversations()
      .then(setConversations)
      .catch((err) => setError(err?.message ?? "Unable to load messages."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadConversations();
  }, []);

  const selected = conversations?.find((c) => c.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    if (!conversations) return [];
    const q = search.trim().toLowerCase();

    return conversations.filter((c) => {
      if (statusFilter === "archived") {
        if (!c.is_archived) return false;
      } else if (c.is_archived) {
        return false;
      }
      if (mailboxFilter !== "all" && c.mailbox !== mailboxFilter) return false;
      if (statusFilter === "unread" && c.is_read) return false;
      if (statusFilter === "starred" && !c.is_starred) return false;
      if (!q) return true;
      return [c.participant_name, c.participant_email, c.subject].some((field) => (field ?? "").toLowerCase().includes(q));
    });
  }, [conversations, search, mailboxFilter, statusFilter]);

  function openConversation(conversation: EmailConversation) {
    setSelectedId(conversation.id);
    setReplyText("");
    setSendError(null);
    setMessagesError(null);
    setMessagesLoading(true);

    fetchMessagesForConversation(conversation.id)
      .then(setMessages)
      .catch((err) => setMessagesError(err?.message ?? "Unable to load this conversation."))
      .finally(() => setMessagesLoading(false));

    if (!conversation.is_read) {
      setConversationRead(conversation.id, true).catch(() => {});
      setConversations((prev) => (prev ? prev.map((c) => (c.id === conversation.id ? { ...c, is_read: true } : c)) : prev));
    }
  }

  function patchConversation(id: string, patch: Partial<EmailConversation>) {
    setConversations((prev) => (prev ? prev.map((c) => (c.id === id ? { ...c, ...patch } : c)) : prev));
  }

  function toggleStar(conversation: EmailConversation) {
    const next = !conversation.is_starred;
    patchConversation(conversation.id, { is_starred: next });
    setConversationStarred(conversation.id, next).catch(() => patchConversation(conversation.id, { is_starred: !next }));
  }

  function toggleArchive(conversation: EmailConversation) {
    const next = !conversation.is_archived;
    patchConversation(conversation.id, { is_archived: next });
    setConversationArchived(conversation.id, next).catch(() => patchConversation(conversation.id, { is_archived: !next }));
  }

  function toggleUnread(conversation: EmailConversation) {
    const next = !conversation.is_read;
    patchConversation(conversation.id, { is_read: next });
    setConversationRead(conversation.id, next).catch(() => patchConversation(conversation.id, { is_read: !next }));
  }

  async function handleSend() {
    if (!selected || !accessToken || !replyText.trim() || sending) return;
    setSending(true);
    setSendError(null);
    try {
      await sendReply(accessToken, selected.id, replyText.trim());
      setReplyText("");
      const refreshed = await fetchMessagesForConversation(selected.id);
      setMessages(refreshed);
      patchConversation(selected.id, { last_message_at: new Date().toISOString() });
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send the reply.");
    } finally {
      setSending(false);
    }
  }

  async function handleSyncNow() {
    if (!accessToken || syncing) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const results = await triggerMailboxSync(accessToken);
      const total = Object.values(results).reduce((sum, r) => sum + (r.newMessages ?? 0), 0);
      const failed = Object.entries(results).filter(([, r]) => !r.ok);
      setSyncMessage(
        failed.length > 0
          ? `Synced with issues: ${failed.map(([mailbox, r]) => `${mailbox} — ${r.error}`).join("; ")}`
          : `Synced — ${total} new message${total === 1 ? "" : "s"}.`,
      );
      loadConversations();
      if (selected) {
        fetchMessagesForConversation(selected.id).then(setMessages).catch(() => {});
      }
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Messages</h1>
          <p className="mt-1 text-ink">
            {loading ? "Fetching messages…" : `${filtered.length} of ${conversations?.length ?? 0} conversations`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSyncNow}
          disabled={syncing || !accessToken}
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          <RefreshIcon className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing…" : "Sync now"}
        </button>
      </div>

      {syncMessage && <p className="mt-3 rounded-md bg-paper px-4 py-2 text-sm text-ink-soft">{syncMessage}</p>}
      {error && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">Unable to load messages. {error}</p>}

      <div className="mt-6 flex h-[calc(100vh-230px)] min-h-[500px] overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_8px_30px_rgba(15,23,42,0.14)]">
        <div className="flex w-full max-w-sm shrink-0 flex-col border-r border-line">
          <div className="space-y-3 border-b border-line p-4">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="w-full rounded-xl border border-line bg-white py-2 pr-3 pl-9 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "sales", "office"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMailboxFilter(m)}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${
                    mailboxFilter === m ? "bg-brand text-white" : "bg-paper text-ink-soft hover:text-ink"
                  }`}
                >
                  {m === "all" ? "All" : MAILBOX_LABELS[m]}
                </button>
              ))}
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className={`${selectClasses} w-full`}>
              <option value="all">All conversations</option>
              <option value="unread">Unread</option>
              <option value="starred">Starred</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-6 text-center text-sm text-ink-soft">Fetching…</p>
            ) : filtered.length === 0 ? (
              <p className="p-6 text-center text-sm text-ink-soft">
                {conversations && conversations.length > 0 ? "No conversations match your search or filters." : "No conversations yet."}
              </p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => openConversation(c)}
                  className={`block w-full border-b border-line px-4 py-3 text-left last:border-b-0 hover:bg-paper/60 ${
                    selectedId === c.id ? "bg-paper" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={c.participant_name || c.participant_email} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`truncate text-sm ${c.is_read ? "font-medium text-ink" : "font-bold text-ink"}`}>
                          {c.participant_name || c.participant_email}
                        </span>
                        <span className="shrink-0 text-xs text-ink-soft">{formatListDate(c.last_message_at)}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${mailboxBadgeClasses(c.mailbox)}`}>
                          {MAILBOX_LABELS[c.mailbox]}
                        </span>
                        {!c.is_read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                        {c.is_starred && <StarIcon className="h-3 w-3 shrink-0 fill-current text-amber-500" />}
                        <span className="truncate text-xs text-ink-soft">{c.subject || "(no subject)"}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center text-ink-soft">
              <MailIcon className="h-10 w-10 text-line" />
              <p className="mt-3 text-sm">Select a conversation to view its messages.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-6 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-base font-semibold text-ink">{selected.subject || "(no subject)"}</h2>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${mailboxBadgeClasses(selected.mailbox)}`}>
                      {MAILBOX_LABELS[selected.mailbox]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-ink-soft">
                    {selected.participant_name ? `${selected.participant_name} · ` : ""}
                    {selected.participant_email}
                  </p>
                  {selected.enquiry_id && (
                    <span className="mt-1 inline-block rounded-full bg-paper px-2 py-0.5 text-xs font-medium text-ink-soft">
                      Linked to enquiry #{selected.enquiry_id}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    title={selected.is_starred ? "Unstar" : "Star"}
                    onClick={() => toggleStar(selected)}
                    className="rounded-lg p-2 text-ink-soft hover:bg-paper hover:text-ink"
                  >
                    <StarIcon className={`h-4 w-4 ${selected.is_starred ? "fill-current text-amber-500" : ""}`} />
                  </button>
                  <button
                    type="button"
                    title="Mark as unread"
                    onClick={() => toggleUnread(selected)}
                    className="rounded-lg p-2 text-ink-soft hover:bg-paper hover:text-ink"
                  >
                    <MailIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title={selected.is_archived ? "Unarchive" : "Archive"}
                    onClick={() => toggleArchive(selected)}
                    className="rounded-lg p-2 text-ink-soft hover:bg-paper hover:text-ink"
                  >
                    <ArchiveIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Close"
                    onClick={() => setSelectedId(null)}
                    className="rounded-lg p-2 text-ink-soft hover:bg-paper hover:text-ink"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
                {messagesLoading ? (
                  <p className="text-center text-sm text-ink-soft">Loading conversation…</p>
                ) : messagesError ? (
                  <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{messagesError}</p>
                ) : messages && messages.length > 0 ? (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[85%] rounded-2xl border p-4 ${
                        m.direction === "outbound" ? "ml-auto border-brand/20 bg-brand/5" : "border-line bg-paper/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-xs text-ink-soft">
                        <span className="font-medium text-ink">{m.direction === "outbound" ? m.from_address : selected.participant_name || m.from_address}</span>
                        <span>{formatFullDate(m.occurred_at)}</span>
                      </div>
                      <p className="mt-2 text-sm whitespace-pre-wrap text-ink">{m.body_text || "(no message body)"}</p>
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {m.attachments.map((a) => (
                            <AttachmentPill key={a.id} filename={a.filename} storagePath={a.storage_path} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-ink-soft">No messages in this conversation yet.</p>
                )}
              </div>

              <div className="border-t border-line p-4">
                {sendError && <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{sendError}</p>}
                <div className="flex items-end gap-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply as ${selected.mailbox === "sales" ? "sales@sellamre.com" : "office@sellamre.com"}…`}
                    rows={3}
                    className="flex-1 resize-none rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending || !replyText.trim()}
                    className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    <SendIcon className="h-4 w-4" />
                    {sending ? "Sending…" : "Send"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
