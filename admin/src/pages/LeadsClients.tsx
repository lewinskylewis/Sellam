import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../components/Avatar";
import { SearchIcon, UsersIcon } from "../components/icons";
import { ConfirmDialog, EmptyState, StageBadge, Toast, TypeBadge, formatRelative } from "../components/leads/shared";
import AddContactModal from "../components/leads/AddContactModal";
import ContactProfile from "../components/leads/ContactProfile";
import PipelineBoard from "../components/leads/PipelineBoard";
import {
  AGENTS,
  SOURCES,
  fullName,
  loadStoredContacts,
  newActivity,
  saveStoredContacts,
  type Agent,
  type Contact,
  type LeadSource,
  type Stage,
} from "../lib/leadsData";

type View = "contacts" | "pipeline";
type StatusFilter = "all" | "leads" | "clients" | Stage | "archived";
type SortKey = "recent-added" | "recent-active" | "oldest" | "name-az" | "name-za" | "followup-due" | "most-enquiries";

const selectClasses = "rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand";

export default function LeadsClients() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>(() => loadStoredContacts());
  const [view, setView] = useState<View>("contacts");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | LeadSource>("all");
  const [agentFilter, setAgentFilter] = useState<"all" | Agent>("all");
  const [sort, setSort] = useState<SortKey>("recent-active");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [followUpFilter, setFollowUpFilter] = useState<"today" | "tomorrow" | "week" | "overdue">("today");
  const [confirmMove, setConfirmMove] = useState<{ id: string; stage: Stage } | null>(null);

  useEffect(() => saveStoredContacts(contacts), [contacts]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  function updateContact(id: string, updater: (c: Contact) => Contact) {
    setContacts((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  }

  const selected = contacts.find((c) => c.id === selectedId) ?? null;

  const active = useMemo(() => contacts.filter((c) => !c.archived), [contacts]);

  const summary = useMemo(
    () => ({
      total: active.length,
      leads: active.filter((c) => c.type === "Lead").length,
      clients: active.filter((c) => c.type === "Client").length,
      followUps: active.filter((c) => c.nextFollowUp).length,
    }),
    [active],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = contacts.filter((c) => {
      if (statusFilter === "archived") return c.archived;
      if (c.archived) return false;
      if (statusFilter === "leads" && c.type !== "Lead") return false;
      if (statusFilter === "clients" && c.type !== "Client") return false;
      if (!["all", "leads", "clients", "archived"].includes(statusFilter) && c.stage !== statusFilter) return false;
      if (sourceFilter !== "all" && c.source !== sourceFilter) return false;
      if (agentFilter !== "all" && c.assignedAgent !== agentFilter) return false;
      if (!q) return true;
      return [fullName(c), c.email, c.phone, c.location, ...c.preferredLocations, ...c.properties.map((p) => p.title)].some((f) => (f ?? "").toLowerCase().includes(q));
    });

    rows = rows.slice().sort((a, b) => {
      switch (sort) {
        case "recent-added":
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        case "oldest":
          return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
        case "name-az":
          return fullName(a).localeCompare(fullName(b));
        case "name-za":
          return fullName(b).localeCompare(fullName(a));
        case "followup-due":
          return (a.nextFollowUp ? new Date(`${a.nextFollowUp.date}T${a.nextFollowUp.time}`).getTime() : Infinity) - (b.nextFollowUp ? new Date(`${b.nextFollowUp.date}T${b.nextFollowUp.time}`).getTime() : Infinity);
        case "most-enquiries":
          return b.enquiries.length - a.enquiries.length;
        case "recent-active":
        default:
          return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
      }
    });

    return rows;
  }, [contacts, search, statusFilter, sourceFilter, agentFilter, sort]);

  const upcomingFollowUps = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 86400000);
    const endOfTomorrow = new Date(startOfToday.getTime() + 2 * 86400000);
    const endOfWeek = new Date(startOfToday.getTime() + 7 * 86400000);

    return active
      .filter((c) => c.nextFollowUp)
      .map((c) => ({ contact: c, due: new Date(`${c.nextFollowUp!.date}T${c.nextFollowUp!.time || "00:00"}`) }))
      .filter(({ due }) => {
        if (followUpFilter === "overdue") return due < startOfToday;
        if (followUpFilter === "today") return due >= startOfToday && due < endOfToday;
        if (followUpFilter === "tomorrow") return due >= endOfToday && due < endOfTomorrow;
        return due >= startOfToday && due < endOfWeek;
      })
      .sort((a, b) => a.due.getTime() - b.due.getTime());
  }, [active, followUpFilter]);

  function handleCreateContact(contact: Contact) {
    setContacts((prev) => [contact, ...prev]);
    setShowAddModal(false);
    setToast(`${fullName(contact)} added.`);
    setSelectedId(contact.id);
  }

  function handleArchive(id: string) {
    const c = contacts.find((x) => x.id === id);
    updateContact(id, (contact) => ({ ...contact, archived: true }));
    setSelectedId(null);
    if (c) setToast(`${fullName(c)} archived.`);
  }

  function handleMoveStage(id: string, stage: Stage) {
    const contact = contacts.find((c) => c.id === id);
    if (!contact || contact.stage === stage) return;
    setConfirmMove({ id, stage });
  }

  function confirmMoveStage() {
    if (!confirmMove) return;
    const { id, stage } = confirmMove;
    const contact = contacts.find((c) => c.id === id);
    if (contact) {
      const prevStage = contact.stage;
      updateContact(id, (c) => ({ ...c, stage, lastActivityAt: new Date().toISOString(), activity: [newActivity("stage_change", "Stage changed", `${prevStage} → ${stage}`), ...c.activity] }));
      setToast(`${fullName(contact)} moved to ${stage}`);
    }
    setConfirmMove(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Leads & Clients</h1>
          <p className="mt-1 text-ink-soft">Manage prospects, leads and clients throughout their relationship with Sellam.</p>
        </div>
        <button type="button" onClick={() => setShowAddModal(true)} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          + Add Contact
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Contacts", value: summary.total },
          { label: "Active Leads", value: summary.leads },
          { label: "Clients", value: summary.clients },
          { label: "Follow-ups Due", value: summary.followUps },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs font-medium tracking-wide text-ink-soft uppercase">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        <div>
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-line bg-surface p-1 w-fit">
            {(["contacts", "pipeline"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${view === v ? "bg-brand text-white" : "text-ink-soft hover:text-ink"}`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px] flex-1">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, phone, property…"
                  className="w-full rounded-xl border border-line bg-white py-2 pr-3 pl-9 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className={selectClasses}>
                <option value="all">All</option>
                <option value="leads">Leads</option>
                <option value="clients">Clients</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Viewing">Viewing</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
                <option value="archived">Archived</option>
              </select>
              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)} className={selectClasses}>
                <option value="all">All sources</option>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value as typeof agentFilter)} className={selectClasses}>
                <option value="all">All agents</option>
                {AGENTS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              {view === "contacts" && (
                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectClasses}>
                  <option value="recent-active">Recently active</option>
                  <option value="recent-added">Recently added</option>
                  <option value="oldest">Oldest</option>
                  <option value="name-az">Name A–Z</option>
                  <option value="name-za">Name Z–A</option>
                  <option value="followup-due">Follow-up due</option>
                  <option value="most-enquiries">Most enquiries</option>
                </select>
              )}
            </div>
            <p className="mt-3 text-xs text-ink-soft">{filtered.length} contact{filtered.length === 1 ? "" : "s"} found</p>
          </div>

          <div className="mt-4">
            {view === "pipeline" ? (
              <PipelineBoard contacts={filtered.filter((c) => !c.archived && c.stage !== "Lost")} onOpenContact={setSelectedId} onMoveStage={handleMoveStage} />
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-line bg-surface">
                {contacts.length === 0 ? (
                  <EmptyState icon={<UsersIcon className="h-8 w-8" />} title="No leads or clients yet." action={
                    <button type="button" onClick={() => setShowAddModal(true)} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                      Add Contact
                    </button>
                  } />
                ) : (
                  <EmptyState title="No contacts match your search." action={
                    <button type="button" onClick={() => { setSearch(""); setStatusFilter("all"); setSourceFilter("all"); setAgentFilter("all"); }} className="text-sm font-medium text-brand hover:underline">
                      Clear Search
                    </button>
                  } />
                )}
              </div>
            ) : (
              <section className="overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-xs font-medium text-ink-soft">
                        <th className="px-6 py-3">Contact</th>
                        <th className="px-3 py-3">Type</th>
                        <th className="px-3 py-3">Interest</th>
                        <th className="px-3 py-3">Stage</th>
                        <th className="px-3 py-3">Last Activity</th>
                        <th className="px-3 py-3">Next Follow-up</th>
                        <th className="px-6 py-3">Agent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c) => (
                        <tr key={c.id} onClick={() => setSelectedId(c.id)} className="cursor-pointer border-b border-line last:border-b-0 hover:bg-paper/60">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={fullName(c)} size={32} />
                              <div className="min-w-0">
                                <p className="truncate font-medium text-ink">{fullName(c)}</p>
                                <p className="truncate text-xs text-ink-soft">{c.email || c.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3"><TypeBadge type={c.type} /></td>
                          <td className="max-w-[160px] truncate px-3 py-3 text-ink-soft">{c.propertyType ? `${c.propertyType}${c.preferredLocations[0] ? " · " + c.preferredLocations[0] : ""}` : "—"}</td>
                          <td className="px-3 py-3"><StageBadge stage={c.stage} /></td>
                          <td className="px-3 py-3 whitespace-nowrap text-ink-soft">{formatRelative(c.lastActivityAt)}</td>
                          <td className="px-3 py-3 whitespace-nowrap text-ink-soft">{c.nextFollowUp ? `${c.nextFollowUp.date} · ${c.nextFollowUp.time}` : "—"}</td>
                          <td className="px-6 py-3 text-ink-soft">{c.assignedAgent}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-line bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Follow-ups</h3>
          </div>
          <div className="mb-3 flex gap-1 rounded-lg bg-paper p-1 text-xs">
            {(["today", "tomorrow", "week", "overdue"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFollowUpFilter(f)}
                className={`flex-1 rounded-md py-1 font-medium capitalize transition-colors ${followUpFilter === f ? "bg-white text-ink shadow-sm" : "text-ink-soft"}`}
              >
                {f === "week" ? "This week" : f}
              </button>
            ))}
          </div>
          {upcomingFollowUps.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-soft">You're all caught up.</p>
          ) : (
            <div className="space-y-2.5">
              {upcomingFollowUps.map(({ contact }) => (
                <button key={contact.id} type="button" onClick={() => setSelectedId(contact.id)} className="block w-full rounded-lg border border-line px-3 py-2 text-left hover:border-brand/40">
                  <p className="text-sm font-medium text-ink">{fullName(contact)}</p>
                  <p className="text-xs text-ink-soft">{contact.nextFollowUp?.title}</p>
                  <p className="mt-0.5 text-xs font-medium text-brand">{contact.nextFollowUp?.time}</p>
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>

      {selected && (
        <ContactProfile
          contact={selected}
          onUpdate={(updater) => updateContact(selected.id, updater)}
          onClose={() => setSelectedId(null)}
          onArchive={() => handleArchive(selected.id)}
          onNavigateToMessages={() => navigate("/messages")}
        />
      )}

      {showAddModal && <AddContactModal onClose={() => setShowAddModal(false)} onCreate={handleCreateContact} />}

      {confirmMove && (
        <ConfirmDialog
          title={`Move ${fullName(contacts.find((c) => c.id === confirmMove.id)!)} to ${confirmMove.stage}?`}
          description="This updates their lifecycle stage and records the change in their activity timeline."
          confirmLabel="Move"
          onCancel={() => setConfirmMove(null)}
          onConfirm={confirmMoveStage}
        />
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}
