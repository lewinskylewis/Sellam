import { useState } from "react";
import Avatar from "../Avatar";
import { CloseIcon, MailIcon, PaperclipIcon, PhoneIcon, SendIcon, StarIcon, WhatsAppIcon } from "../icons";
import { ConfirmDialog, StageBadge, TypeBadge, formatMoney, formatRelative } from "./shared";
import {
  AGENTS,
  COMMUNITIES,
  INTENTS,
  SOURCES,
  STAGES,
  emptyFollowUp,
  fullName,
  newActivity,
  type Contact,
  type FollowUp,
  type Intent,
  type LeadSource,
  type Stage,
} from "../../lib/leadsData";

type Tab = "overview" | "activity" | "followups" | "relationship";

const inputClasses = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand";
const labelClasses = "mb-1 block text-xs font-medium text-ink-soft";

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-ink-soft uppercase">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

const ACTIVITY_DOT: Record<string, string> = {
  enquiry: "bg-sky-500",
  message: "bg-emerald-500",
  call: "bg-violet-500",
  note: "bg-amber-500",
  viewing: "bg-teal-500",
  follow_up: "bg-orange-500",
  stage_change: "bg-ink",
  conversion: "bg-brand",
};

export default function ContactProfile({
  contact,
  onUpdate,
  onClose,
  onArchive,
  onNavigateToMessages,
}: {
  contact: Contact;
  onUpdate: (updater: (c: Contact) => Contact) => void;
  onClose: () => void;
  onArchive: () => void;
  onNavigateToMessages: () => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [editingInfo, setEditingInfo] = useState(false);
  const [editingLead, setEditingLead] = useState(false);
  const [infoDraft, setInfoDraft] = useState(contact);
  const [leadDraft, setLeadDraft] = useState(contact);
  const [addingNote, setAddingNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [confirmConvert, setConfirmConvert] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [schedulingFollowUp, setSchedulingFollowUp] = useState(false);
  const [followUpDraft, setFollowUpDraft] = useState<FollowUp>(emptyFollowUp());

  function touch(c: Contact): Contact {
    return { ...c, lastActivityAt: new Date().toISOString() };
  }

  function changeStage(next: Stage) {
    if (next === contact.stage) return;
    const prev = contact.stage;
    onUpdate((c) => touch({ ...c, stage: next, activity: [newActivity("stage_change", "Stage changed", `${prev} → ${next}`), ...c.activity] }));
  }

  function convertToClient() {
    onUpdate((c) => touch({ ...c, type: "Client", activity: [newActivity("conversion", "Converted to client"), ...c.activity] }));
    setConfirmConvert(false);
  }

  function saveInfo() {
    onUpdate(() => touch(infoDraft));
    setEditingInfo(false);
  }

  function saveLead() {
    onUpdate(() => touch(leadDraft));
    setEditingLead(false);
  }

  function addNote() {
    if (!noteText.trim()) return;
    onUpdate((c) =>
      touch({
        ...c,
        notes: [{ id: `${Date.now()}`, text: noteText.trim(), timestamp: new Date().toISOString(), author: c.assignedAgent }, ...c.notes],
        activity: [newActivity("note", "Agent note", noteText.trim()), ...c.activity],
      }),
    );
    setNoteText("");
    setAddingNote(false);
  }

  function completeFollowUp() {
    onUpdate((c) => touch({ ...c, nextFollowUp: null, activity: [newActivity("follow_up", "Follow-up completed", c.nextFollowUp?.title), ...c.activity] }));
  }

  function scheduleFollowUp() {
    if (!followUpDraft.title.trim() || !followUpDraft.date) return;
    onUpdate((c) => touch({ ...c, nextFollowUp: followUpDraft, activity: [newActivity("follow_up", "Follow-up scheduled", `${followUpDraft.title} · ${followUpDraft.date}`), ...c.activity] }));
    setSchedulingFollowUp(false);
    setFollowUpDraft(emptyFollowUp());
  }

  function toggleLocation(list: string[], loc: string) {
    return list.includes(loc) ? list.filter((l) => l !== loc) : [...list, loc];
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="flex h-full w-full max-w-2xl flex-col bg-surface shadow-2xl">
        {/* Header */}
        <div className="border-b border-line px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={fullName(contact)} size={48} />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-ink">{fullName(contact)}</h2>
                  <TypeBadge type={contact.type} />
                </div>
                <p className="mt-0.5 text-sm text-ink-soft">
                  {contact.phone} {contact.email && `· ${contact.email}`} {contact.location && `· ${contact.location}`}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-ink-soft hover:bg-paper hover:text-ink">
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand hover:text-brand">
              <PhoneIcon className="h-3.5 w-3.5" /> Call
            </a>
            <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand hover:text-brand">
              <MailIcon className="h-3.5 w-3.5" /> Email
            </a>
            <a
              href={`https://wa.me/${contact.phone.replace(/[^\d]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand hover:text-brand"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp
            </a>
            <button type="button" onClick={() => setAddingNote(true)} className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand hover:text-brand">
              <PaperclipIcon className="h-3.5 w-3.5" /> Add Note
            </button>
            <button
              type="button"
              onClick={() => setSchedulingFollowUp(true)}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand hover:text-brand"
            >
              <StarIcon className="h-3.5 w-3.5" /> Schedule Follow-up
            </button>
            {contact.type === "Lead" && (
              <button type="button" onClick={() => setConfirmConvert(true)} className="ml-auto rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
                Convert to Client
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-line px-6">
          {(
            [
              { id: "overview", label: "Overview" },
              { id: "activity", label: "Activity" },
              { id: "followups", label: "Follow-ups" },
              { id: "relationship", label: "Relationship" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${tab === t.id ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "overview" && (
            <div className="space-y-8">
              <section>
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-line bg-paper/40 p-4 sm:grid-cols-3">
                  <SummaryItem label="Contact since" value={new Date(contact.dateAdded).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })} />
                  <SummaryItem label="Source" value={contact.source} />
                  <SummaryItem label="Assigned to" value={contact.assignedAgent} />
                  <SummaryItem label="Current stage" value={contact.stage} />
                  <SummaryItem label="Last activity" value={formatRelative(contact.lastActivityAt)} />
                  <SummaryItem label="Next follow-up" value={contact.nextFollowUp ? `${contact.nextFollowUp.date} · ${contact.nextFollowUp.time}` : "None scheduled"} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-medium text-ink-soft">Lifecycle stage</span>
                  <select
                    value={contact.stage}
                    onChange={(e) => changeStage(e.target.value as Stage)}
                    className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm font-medium text-ink outline-none focus:border-brand"
                  >
                    {[...STAGES, "Lost" as Stage].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <StageBadge stage={contact.stage} />
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink">Contact Information</h3>
                  {!editingInfo ? (
                    <button type="button" onClick={() => { setInfoDraft(contact); setEditingInfo(true); }} className="text-xs font-medium text-brand hover:underline">
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEditingInfo(false)} className="text-xs font-medium text-ink-soft hover:text-ink">
                        Cancel
                      </button>
                      <button type="button" onClick={saveInfo} className="text-xs font-medium text-brand hover:underline">
                        Save
                      </button>
                    </div>
                  )}
                </div>
                {!editingInfo ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                    <p className="text-ink-soft">First name <span className="ml-1 font-medium text-ink">{contact.firstName}</span></p>
                    <p className="text-ink-soft">Last name <span className="ml-1 font-medium text-ink">{contact.lastName}</span></p>
                    <p className="text-ink-soft">Email <span className="ml-1 font-medium text-ink">{contact.email || "—"}</span></p>
                    <p className="text-ink-soft">Phone <span className="ml-1 font-medium text-ink">{contact.phone || "—"}</span></p>
                    <p className="text-ink-soft">Alt. phone <span className="ml-1 font-medium text-ink">{contact.altPhone || "—"}</span></p>
                    <p className="text-ink-soft">Preferred contact <span className="ml-1 font-medium text-ink">{contact.preferredContact}</span></p>
                    <p className="text-ink-soft">Location <span className="ml-1 font-medium text-ink">{contact.location || "—"}</span></p>
                    <p className="text-ink-soft">Assigned agent <span className="ml-1 font-medium text-ink">{contact.assignedAgent}</span></p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelClasses}>First name</label><input className={inputClasses} value={infoDraft.firstName} onChange={(e) => setInfoDraft({ ...infoDraft, firstName: e.target.value })} /></div>
                    <div><label className={labelClasses}>Last name</label><input className={inputClasses} value={infoDraft.lastName} onChange={(e) => setInfoDraft({ ...infoDraft, lastName: e.target.value })} /></div>
                    <div><label className={labelClasses}>Email</label><input className={inputClasses} value={infoDraft.email} onChange={(e) => setInfoDraft({ ...infoDraft, email: e.target.value })} /></div>
                    <div><label className={labelClasses}>Phone</label><input className={inputClasses} value={infoDraft.phone} onChange={(e) => setInfoDraft({ ...infoDraft, phone: e.target.value })} /></div>
                    <div><label className={labelClasses}>Alt. phone</label><input className={inputClasses} value={infoDraft.altPhone} onChange={(e) => setInfoDraft({ ...infoDraft, altPhone: e.target.value })} /></div>
                    <div>
                      <label className={labelClasses}>Preferred contact</label>
                      <select className={inputClasses} value={infoDraft.preferredContact} onChange={(e) => setInfoDraft({ ...infoDraft, preferredContact: e.target.value as Contact["preferredContact"] })}>
                        <option value="Phone">Phone</option>
                        <option value="Email">Email</option>
                        <option value="WhatsApp">WhatsApp</option>
                      </select>
                    </div>
                    <div><label className={labelClasses}>Location</label><input className={inputClasses} value={infoDraft.location} onChange={(e) => setInfoDraft({ ...infoDraft, location: e.target.value })} /></div>
                    <div>
                      <label className={labelClasses}>Assigned agent</label>
                      <select className={inputClasses} value={infoDraft.assignedAgent} onChange={(e) => setInfoDraft({ ...infoDraft, assignedAgent: e.target.value as Contact["assignedAgent"] })}>
                        {AGENTS.map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink">Lead / Client Information</h3>
                  {!editingLead ? (
                    <button type="button" onClick={() => { setLeadDraft(contact); setEditingLead(true); }} className="text-xs font-medium text-brand hover:underline">
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEditingLead(false)} className="text-xs font-medium text-ink-soft hover:text-ink">
                        Cancel
                      </button>
                      <button type="button" onClick={saveLead} className="text-xs font-medium text-brand hover:underline">
                        Save
                      </button>
                    </div>
                  )}
                </div>
                {!editingLead ? (
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                      <p className="text-ink-soft">Intent <span className="ml-1 font-medium text-ink">{contact.intent}</span></p>
                      <p className="text-ink-soft">Budget <span className="ml-1 font-medium text-ink">{formatMoney(contact.budgetMin, contact.currency)} – {formatMoney(contact.budgetMax, contact.currency)}</span></p>
                      <p className="text-ink-soft">Property type <span className="ml-1 font-medium text-ink">{contact.propertyType || "—"}</span></p>
                      <p className="text-ink-soft">Bed / Bath <span className="ml-1 font-medium text-ink">{contact.bedrooms ?? "—"} / {contact.bathrooms ?? "—"}</span></p>
                      <p className="text-ink-soft">Furnishing <span className="ml-1 font-medium text-ink">{contact.furnished}</span></p>
                      <p className="text-ink-soft">Preferred size <span className="ml-1 font-medium text-ink">{contact.preferredSize || "—"}</span></p>
                    </div>
                    <div>
                      <p className="text-ink-soft">Preferred locations</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {contact.preferredLocations.length ? contact.preferredLocations.map((l) => (
                          <span key={l} className="rounded-full bg-paper px-2 py-0.5 text-xs text-ink">{l}</span>
                        )) : <span className="text-xs text-ink-soft">—</span>}
                      </div>
                    </div>
                    {contact.otherRequirements && (
                      <div>
                        <p className="text-ink-soft">Notes</p>
                        <p className="mt-1 text-ink">{contact.otherRequirements}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClasses}>Intent</label>
                        <select className={inputClasses} value={leadDraft.intent} onChange={(e) => setLeadDraft({ ...leadDraft, intent: e.target.value as Intent })}>
                          {INTENTS.map((i) => (
                            <option key={i} value={i}>{i}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClasses}>Source</label>
                        <select className={inputClasses} value={leadDraft.source} onChange={(e) => setLeadDraft({ ...leadDraft, source: e.target.value as LeadSource })}>
                          {SOURCES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div><label className={labelClasses}>Min budget</label><input type="number" className={inputClasses} value={leadDraft.budgetMin ?? ""} onChange={(e) => setLeadDraft({ ...leadDraft, budgetMin: e.target.value ? Number(e.target.value) : null })} /></div>
                      <div><label className={labelClasses}>Max budget</label><input type="number" className={inputClasses} value={leadDraft.budgetMax ?? ""} onChange={(e) => setLeadDraft({ ...leadDraft, budgetMax: e.target.value ? Number(e.target.value) : null })} /></div>
                      <div><label className={labelClasses}>Property type</label><input className={inputClasses} value={leadDraft.propertyType} onChange={(e) => setLeadDraft({ ...leadDraft, propertyType: e.target.value })} /></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className={labelClasses}>Beds</label><input type="number" className={inputClasses} value={leadDraft.bedrooms ?? ""} onChange={(e) => setLeadDraft({ ...leadDraft, bedrooms: e.target.value ? Number(e.target.value) : null })} /></div>
                        <div><label className={labelClasses}>Baths</label><input type="number" className={inputClasses} value={leadDraft.bathrooms ?? ""} onChange={(e) => setLeadDraft({ ...leadDraft, bathrooms: e.target.value ? Number(e.target.value) : null })} /></div>
                      </div>
                    </div>
                    <div>
                      <label className={labelClasses}>Preferred locations</label>
                      <div className="flex flex-wrap gap-1.5">
                        {COMMUNITIES.map((loc) => (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => setLeadDraft({ ...leadDraft, preferredLocations: toggleLocation(leadDraft.preferredLocations, loc) })}
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${leadDraft.preferredLocations.includes(loc) ? "border-brand bg-brand/5 text-brand" : "border-line text-ink-soft"}`}
                          >
                            {loc}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelClasses}>Other requirements</label>
                      <textarea rows={2} className={`${inputClasses} resize-none`} value={leadDraft.otherRequirements} onChange={(e) => setLeadDraft({ ...leadDraft, otherRequirements: e.target.value })} />
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === "activity" && (
            <div>
              <button type="button" onClick={() => setAddingNote(true)} className="mb-4 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand hover:text-brand">
                + Add note
              </button>
              {contact.activity.length === 0 ? (
                <p className="py-10 text-center text-sm text-ink-soft">No activity has been recorded for this contact yet.</p>
              ) : (
                <ol className="space-y-4 border-l border-line pl-5">
                  {contact.activity.map((a) => (
                    <li key={a.id} className="relative">
                      <span className={`absolute top-1 -left-[25px] h-2.5 w-2.5 rounded-full ${ACTIVITY_DOT[a.type] ?? "bg-line"}`} />
                      <p className="text-xs text-ink-soft">{formatRelative(a.timestamp)}</p>
                      <p className="text-sm font-medium text-ink">{a.title}</p>
                      {a.detail && <p className="text-sm text-ink-soft">{a.detail}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {tab === "followups" && (
            <div className="space-y-5">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-ink">Next Follow-up</h3>
                {contact.nextFollowUp ? (
                  <div className="rounded-xl border border-line p-4">
                    <p className="text-sm font-semibold text-ink">{contact.nextFollowUp.date} · {contact.nextFollowUp.time}</p>
                    <p className="mt-0.5 text-sm text-ink-soft">{contact.nextFollowUp.title}</p>
                    {contact.nextFollowUp.notes && <p className="mt-1 text-xs text-ink-soft">{contact.nextFollowUp.notes}</p>}
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={completeFollowUp} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
                        Complete
                      </button>
                      <button
                        type="button"
                        onClick={() => { setFollowUpDraft(contact.nextFollowUp!); setSchedulingFollowUp(true); }}
                        className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand hover:text-brand"
                      >
                        Reschedule
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-line p-4 text-center">
                    <p className="text-sm text-ink-soft">No follow-up scheduled.</p>
                    <button type="button" onClick={() => setSchedulingFollowUp(true)} className="mt-2 text-xs font-medium text-brand hover:underline">
                      Schedule Follow-up
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "relationship" && (
            <div className="space-y-8">
              <section>
                <h3 className="mb-2 text-sm font-semibold text-ink">Associated Enquiries</h3>
                {contact.enquiries.length === 0 ? (
                  <p className="text-sm text-ink-soft">No enquiries recorded.</p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-line">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-line bg-paper/60 text-left text-xs font-medium text-ink-soft">
                          <th className="px-3 py-2">Property</th>
                          <th className="px-3 py-2">Source</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contact.enquiries.map((e) => (
                          <tr key={e.id} className="cursor-pointer border-b border-line last:border-b-0 hover:bg-paper/60">
                            <td className="px-3 py-2 font-medium text-ink">{e.property}</td>
                            <td className="px-3 py-2 text-ink-soft">{e.source}</td>
                            <td className="px-3 py-2 text-ink-soft">{e.status}</td>
                            <td className="px-3 py-2 text-ink-soft">{new Date(e.date).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-ink">Interested Properties</h3>
                {contact.properties.length === 0 ? (
                  <p className="text-sm text-ink-soft">No properties recorded yet.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {contact.properties.map((p) => (
                      <div key={p.id} className="overflow-hidden rounded-xl border border-line">
                        <div className="h-24 bg-paper bg-cover bg-center" style={{ backgroundImage: `url('${p.image}')` }} />
                        <div className="p-3">
                          <p className="text-sm font-medium text-ink">{p.title}</p>
                          <p className="text-xs text-ink-soft">{p.location}</p>
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className="text-xs font-medium text-ink">{p.price}</span>
                            <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] font-medium text-ink-soft">{p.state}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-ink">Viewings</h3>
                {contact.viewings.length === 0 ? (
                  <p className="text-sm text-ink-soft">No viewings recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {contact.viewings.map((v) => (
                      <div key={v.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-ink">{v.property}</p>
                          <p className="text-xs text-ink-soft">{new Date(v.date).toLocaleDateString(undefined, { day: "2-digit", month: "short" })} · {v.time}</p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            v.status === "Scheduled" ? "bg-sky-50 text-sky-700" : v.status === "Completed" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          }`}
                        >
                          {v.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink">Recent Messages</h3>
                  <button type="button" onClick={onNavigateToMessages} className="flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                    <SendIcon className="h-3 w-3" /> View in Messages
                  </button>
                </div>
                {contact.messages.length === 0 ? (
                  <p className="text-sm text-ink-soft">No message history yet.</p>
                ) : (
                  <div className="space-y-2 rounded-xl border border-line p-3">
                    {contact.messages.map((m) => (
                      <div key={m.id} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.from === "sellam" ? "ml-auto bg-brand/5 text-ink" : "bg-paper text-ink"}`}>
                        {m.text}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        <div className="border-t border-line px-6 py-3">
          <button type="button" onClick={() => setConfirmArchive(true)} className="text-xs font-medium text-ink-soft hover:text-red-600">
            Archive Contact
          </button>
        </div>
      </div>

      {addingNote && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-ink">Add note</h3>
            <textarea
              autoFocus
              rows={4}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Client prefers properties with private parking…"
              className="mt-3 w-full resize-none rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => { setAddingNote(false); setNoteText(""); }} className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-paper">
                Cancel
              </button>
              <button type="button" onClick={addNote} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}

      {schedulingFollowUp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-ink">Schedule Follow-up</h3>
            <div className="mt-3 space-y-3">
              <div>
                <label className={labelClasses}>Title</label>
                <input className={inputClasses} value={followUpDraft.title} onChange={(e) => setFollowUpDraft({ ...followUpDraft, title: e.target.value })} placeholder="Call client after viewing" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClasses}>Date</label>
                  <input type="date" className={inputClasses} value={followUpDraft.date} onChange={(e) => setFollowUpDraft({ ...followUpDraft, date: e.target.value })} />
                </div>
                <div>
                  <label className={labelClasses}>Time</label>
                  <input type="time" className={inputClasses} value={followUpDraft.time} onChange={(e) => setFollowUpDraft({ ...followUpDraft, time: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={labelClasses}>Notes</label>
                <textarea rows={2} className={`${inputClasses} resize-none`} value={followUpDraft.notes} onChange={(e) => setFollowUpDraft({ ...followUpDraft, notes: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={followUpDraft.reminder} onChange={(e) => setFollowUpDraft({ ...followUpDraft, reminder: e.target.checked })} className="h-4 w-4 rounded border-line text-brand" />
                Remind me
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setSchedulingFollowUp(false)} className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-paper">
                Cancel
              </button>
              <button type="button" onClick={scheduleFollowUp} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmConvert && (
        <ConfirmDialog
          title="Convert this lead to a client?"
          description={`${fullName(contact)} will be marked as a Client. Their full history is preserved — this does not create a new record.`}
          confirmLabel="Convert"
          onCancel={() => setConfirmConvert(false)}
          onConfirm={convertToClient}
        />
      )}

      {confirmArchive && (
        <ConfirmDialog
          title={`Archive ${fullName(contact)}?`}
          description="Archived contacts will no longer appear in the active CRM views. You can still find them under the Archived filter."
          confirmLabel="Archive"
          destructive
          onCancel={() => setConfirmArchive(false)}
          onConfirm={() => { onArchive(); setConfirmArchive(false); }}
        />
      )}
    </div>
  );
}
