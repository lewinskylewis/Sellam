import { Field, RadioCards, Toggle } from "../Controls";
import { DesktopIcon, MoonIcon, SunIcon } from "../../icons";
import type { SettingsState } from "../../../lib/settingsDefaults";

type Appearance = SettingsState["appearance"];

const ACCENTS = ["#0f766e", "#1d4ed8", "#b91c1c", "#a16207", "#7c3aed", "#0f172a"];
const RADIUS_PX: Record<Appearance["radius"], string> = { sharp: "4px", soft: "12px", round: "20px" };

export default function AppearanceSection({ value, onChange }: { value: Appearance; onChange: (next: Appearance) => void }) {
  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_320px]">
      <div className="divide-y divide-line">
        <section>
          <h4 className="mb-1 text-sm font-semibold text-ink">Appearance</h4>
          <Field label="Mode">
            <div className="flex gap-2">
              {(
                [
                  { value: "light", label: "Light", icon: SunIcon },
                  { value: "dark", label: "Dark", icon: MoonIcon },
                  { value: "system", label: "System", icon: DesktopIcon },
                ] as const
              ).map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange({ ...value, mode: opt.value })}
                    className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                      value.mode === opt.value ? "border-brand bg-brand/5 text-brand" : "border-line text-ink hover:border-ink-soft"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Field>
        </section>

        <section className="pt-6">
          <h4 className="mb-1 text-sm font-semibold text-ink">Theme</h4>
          <Field label="Accent colour">
            <div className="flex gap-2">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => onChange({ ...value, accent: c })}
                  style={{ backgroundColor: c }}
                  className={`h-8 w-8 rounded-full transition-transform ${value.accent === c ? "scale-110 ring-2 ring-offset-2 ring-ink" : "hover:scale-105"}`}
                />
              ))}
            </div>
          </Field>
          <Field label="Interface density">
            <RadioCards
              value={value.density}
              onChange={(v) => onChange({ ...value, density: v })}
              options={[
                { value: "comfortable", label: "Comfortable" },
                { value: "compact", label: "Compact" },
              ]}
            />
          </Field>
          <Field label="Border radius">
            <RadioCards
              value={value.radius}
              onChange={(v) => onChange({ ...value, radius: v })}
              options={[
                { value: "sharp", label: "Sharp" },
                { value: "soft", label: "Soft" },
                { value: "round", label: "Round" },
              ]}
            />
          </Field>
        </section>

        <section className="pt-6">
          <h4 className="mb-1 text-sm font-semibold text-ink">Sidebar</h4>
          <Field label="Sidebar style">
            <RadioCards
              value={value.sidebarStyle}
              onChange={(v) => onChange({ ...value, sidebarStyle: v })}
              options={[
                { value: "expanded", label: "Expanded" },
                { value: "collapsed", label: "Collapsed" },
              ]}
            />
          </Field>
          <Field label="Remember last sidebar state">
            <Toggle checked={value.rememberSidebar} onChange={(v) => onChange({ ...value, rememberSidebar: v })} />
          </Field>
        </section>
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <p className="mb-2 text-xs font-medium tracking-wide text-ink-soft uppercase">Live preview</p>
        <div
          className={`overflow-hidden border shadow-[0_8px_30px_rgba(15,23,42,0.1)] ${value.mode === "dark" ? "border-white/10 bg-ink" : "border-line bg-white"}`}
          style={{ borderRadius: RADIUS_PX[value.radius] }}
        >
          <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: value.accent }}>
            <div className="h-2.5 w-2.5 rounded-full bg-white/70" />
            <div className={`h-2 flex-1 rounded-full bg-white/40 ${value.sidebarStyle === "collapsed" ? "max-w-[40px]" : "max-w-[90px]"}`} />
          </div>
          <div className={value.density === "compact" ? "space-y-1.5 p-3" : "space-y-2.5 p-4"}>
            {[80, 60, 70].map((w, i) => (
              <div key={i} className={`h-2.5 rounded-full ${value.mode === "dark" ? "bg-white/15" : "bg-paper"}`} style={{ width: `${w}%`, borderRadius: RADIUS_PX[value.radius] }} />
            ))}
            <div className="pt-1">
              <span
                className="inline-block px-3 py-1.5 text-xs font-medium text-white"
                style={{ backgroundColor: value.accent, borderRadius: RADIUS_PX[value.radius] }}
              >
                Sample button
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
