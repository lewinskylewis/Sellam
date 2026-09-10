import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { Field, Select, Toggle } from "../Controls";
import type { SettingsState } from "../../../lib/settingsDefaults";

type Security = SettingsState["security"];

// Real Supabase Auth session data isn't available for these — see the
// Settings audit: supabase-js has no client-side API to list a user's
// sessions across devices (that needs a service-role server endpoint,
// explicitly deferred). Kept as an honestly-labeled illustration, not
// presented as live data.
const MOCK_SESSIONS = [
  { device: "Chrome on Windows", location: "Nairobi, Kenya", current: true, lastActive: "Active now" },
  { device: "Safari on iPhone", location: "Nairobi, Kenya", current: false, lastActive: "2 days ago" },
];

const MIN_PASSWORD_LENGTH = 8;

export default function SecuritySection({ value, onChange }: { value: Security; onChange: (next: Security) => void }) {
  const [configuring2fa, setConfiguring2fa] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  function closePasswordModal() {
    setChangingPassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setPasswordSuccess(false);
  }

  async function handleUpdatePassword() {
    if (updatingPassword) return;
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError("Enter your current password.");
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("New password must be different from your current password.");
      return;
    }

    setUpdatingPassword(true);
    try {
      const email = (await supabase.auth.getSession()).data.session?.user.email;
      if (!email) throw new Error("No signed-in session found.");

      // Supabase's updateUser() doesn't itself require the current
      // password, but changing a credential blind (without re-verifying
      // the one currently in use) would let a hijacked, still-open session
      // silently lock the real owner out — re-authenticating first closes
      // that gap.
      const { error: reauthError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (reauthError) throw new Error("Current password is incorrect.");

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  }

  return (
    <div className="divide-y divide-line">
      <section>
        <h4 className="mb-3 text-sm font-semibold text-ink">Account</h4>
        <div className="flex items-center justify-between rounded-lg border border-line px-4 py-3">
          <div>
            <p className="text-sm font-medium text-ink">Change password</p>
          </div>
          <button type="button" onClick={() => setChangingPassword(true)} className="rounded-lg border border-line px-3.5 py-1.5 text-sm font-medium text-ink hover:border-brand hover:text-brand">
            Change
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-lg border border-line px-4 py-3">
          <div>
            <p className="text-sm font-medium text-ink">Two-factor authentication</p>
            <p className="text-xs text-ink-soft">{value.twoFactor === "enabled" ? "Enabled — your account requires a second step at sign-in." : "Not configured"}</p>
          </div>
          {value.twoFactor === "enabled" ? (
            <button type="button" onClick={() => onChange({ ...value, twoFactor: "not_configured" })} className="rounded-lg border border-line px-3.5 py-1.5 text-sm font-medium text-ink hover:border-red-400 hover:text-red-600">
              Disable
            </button>
          ) : (
            <button type="button" onClick={() => setConfiguring2fa(true)} className="rounded-lg bg-brand px-3.5 py-1.5 text-sm font-semibold text-white hover:opacity-90">
              Configure
            </button>
          )}
        </div>
      </section>

      <section className="pt-6">
        <h4 className="mb-1 text-sm font-semibold text-ink">Session Preferences</h4>
        <Field label="Session timeout" description="Saved as a preference — not yet enforced by the dashboard.">
          <Select
            value={String(value.sessionTimeoutMinutes)}
            onChange={(v) => onChange({ ...value, sessionTimeoutMinutes: Number(v) })}
            options={["15", "30", "60", "240", "0"].map((v) => ({ value: v, label: v === "0" ? "Never" : `${v} minutes` }))}
          />
        </Field>
        <Field label="Login notifications" description="Saved as a preference — no login-notification email is sent yet.">
          <Toggle checked={value.loginNotifications} onChange={(v) => onChange({ ...value, loginNotifications: v })} />
        </Field>
        <Field label="Remember this device">
          <Toggle checked={value.rememberDevice} onChange={(v) => onChange({ ...value, rememberDevice: v })} />
        </Field>
      </section>

      <section className="pt-6">
        <h4 className="mb-1 text-sm font-semibold text-ink">Active Sessions</h4>
        <p className="mb-3 text-xs text-ink-soft">Illustrative only — listing real sessions across devices requires a server-side check this dashboard doesn't perform yet.</p>
        <div className="space-y-2">
          {MOCK_SESSIONS.map((s) => (
            <div key={s.device} className="flex items-center justify-between rounded-lg border border-line px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">
                  {s.device} {s.current && <span className="ml-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 uppercase">This device</span>}
                </p>
                <p className="text-xs text-ink-soft">{s.location} · {s.lastActive}</p>
              </div>
              {!s.current && (
                <button type="button" disabled className="text-xs font-medium text-ink-soft opacity-50" title="Not available yet">
                  Sign out
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {configuring2fa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-ink">Set up two-factor authentication</h3>
            <p className="mt-2 text-sm text-ink-soft">This is a UI demonstration — no real authenticator is connected. Confirming below just flips the local preference.</p>
            <div className="mt-4 flex h-32 items-center justify-center rounded-lg border border-dashed border-line text-xs text-ink-soft">QR code placeholder</div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfiguring2fa(false)} className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-paper">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange({ ...value, twoFactor: "enabled" });
                  setConfiguring2fa(false);
                }}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Enable
              </button>
            </div>
          </div>
        </div>
      )}

      {changingPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-ink">Change password</h3>
            {passwordSuccess ? (
              <>
                <p className="mt-2 text-sm text-emerald-700">Password updated successfully.</p>
                <div className="mt-5 flex justify-end">
                  <button type="button" onClick={closePasswordModal} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-ink-soft">New password must be at least {MIN_PASSWORD_LENGTH} characters.</p>
                <div className="mt-4 space-y-2.5">
                  <input
                    type="password"
                    placeholder="Current password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={updatingPassword}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand disabled:opacity-60"
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={updatingPassword}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand disabled:opacity-60"
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={updatingPassword}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand disabled:opacity-60"
                  />
                </div>
                {passwordError && <p className="mt-2 text-xs text-red-600">{passwordError}</p>}
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" onClick={closePasswordModal} disabled={updatingPassword} className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-paper disabled:opacity-50">
                    Cancel
                  </button>
                  <button type="button" onClick={handleUpdatePassword} disabled={updatingPassword} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
                    {updatingPassword ? "Updating…" : "Update password"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
