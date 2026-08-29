import { Field, Select, TextInput, Toggle } from "../Controls";
import type { SettingsState } from "../../../lib/settingsDefaults";

type Notifications = SettingsState["notifications"];

export default function NotificationsSection({ value, onChange }: { value: Notifications; onChange: (next: Notifications) => void }) {
  const { dashboard, behaviour } = value;

  function patchRow(key: string, patch: Partial<Notifications["dashboard"][number]>) {
    onChange({ ...value, dashboard: dashboard.map((row) => (row.key === key ? { ...row, ...patch } : row)) });
  }

  return (
    <div className="divide-y divide-line">
      <section>
        <h4 className="mb-3 text-sm font-semibold text-ink">Dashboard Notifications</h4>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line bg-paper/60 text-left text-xs font-medium text-ink-soft">
                <th className="px-4 py-2.5">Event</th>
                <th className="px-3 py-2.5 text-center">Enabled</th>
                <th className="px-3 py-2.5 text-center">In-dashboard</th>
                <th className="px-3 py-2.5 text-center">Email</th>
                <th className="px-3 py-2.5 text-center">Push</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.map((row) => (
                <tr key={row.key} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-ink">{row.label}</td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex justify-center">
                      <Toggle checked={row.enabled} onChange={(v) => patchRow(row.key, { enabled: v })} label={`${row.label} enabled`} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <input
                      type="checkbox"
                      disabled={!row.enabled}
                      checked={row.inDashboard}
                      onChange={(e) => patchRow(row.key, { inDashboard: e.target.checked })}
                      className="h-4 w-4 rounded border-line text-brand focus:ring-brand disabled:opacity-40"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <input
                      type="checkbox"
                      disabled={!row.enabled}
                      checked={row.email}
                      onChange={(e) => patchRow(row.key, { email: e.target.checked })}
                      className="h-4 w-4 rounded border-line text-brand focus:ring-brand disabled:opacity-40"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <input
                      type="checkbox"
                      disabled={!row.enabled}
                      checked={row.push}
                      onChange={(e) => patchRow(row.key, { push: e.target.checked })}
                      className="h-4 w-4 rounded border-line text-brand focus:ring-brand disabled:opacity-40"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="pt-6">
        <h4 className="mb-1 text-sm font-semibold text-ink">Notification Behaviour</h4>
        <Field label="Notification sound">
          <Toggle checked={behaviour.sound} onChange={(v) => onChange({ ...value, behaviour: { ...behaviour, sound: v } })} />
        </Field>
        <Field label="Desktop notifications" description="Requires browser permission — this switch only reflects the preference, no permission prompt is triggered here.">
          <Toggle checked={behaviour.desktop} onChange={(v) => onChange({ ...value, behaviour: { ...behaviour, desktop: v } })} />
        </Field>
        <Field label="Group similar notifications">
          <Toggle checked={behaviour.grouping} onChange={(v) => onChange({ ...value, behaviour: { ...behaviour, grouping: v } })} />
        </Field>
        <Field label="Mark as read when opened">
          <Toggle checked={behaviour.markAsReadOnOpen} onChange={(v) => onChange({ ...value, behaviour: { ...behaviour, markAsReadOnOpen: v } })} />
        </Field>
        <Field label="Reminder timing">
          <Select
            value={behaviour.reminderTiming}
            onChange={(v) => onChange({ ...value, behaviour: { ...behaviour, reminderTiming: v } })}
            options={["15 minutes before", "30 minutes before", "1 hour before", "1 day before"].map((v) => ({ value: v, label: v }))}
          />
        </Field>
        <Field label="Quiet hours" description="Pause non-critical notifications during this window.">
          <div className="flex items-center gap-3">
            <Toggle checked={behaviour.quietHoursEnabled} onChange={(v) => onChange({ ...value, behaviour: { ...behaviour, quietHoursEnabled: v } })} />
            {behaviour.quietHoursEnabled && (
              <div className="flex items-center gap-2 text-sm text-ink-soft">
                <TextInput type="time" value={behaviour.quietStart} onChange={(e) => onChange({ ...value, behaviour: { ...behaviour, quietStart: e.target.value } })} className="max-w-[110px]" />
                <span>to</span>
                <TextInput type="time" value={behaviour.quietEnd} onChange={(e) => onChange({ ...value, behaviour: { ...behaviour, quietEnd: e.target.value } })} className="max-w-[110px]" />
              </div>
            )}
          </div>
        </Field>
      </section>
    </div>
  );
}
