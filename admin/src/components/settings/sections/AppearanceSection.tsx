import { useRef, useState } from "react";
import { Field, RadioCards, Toggle } from "../Controls";
import { DesktopIcon, MoonIcon, SunIcon } from "../../icons";
import type { SettingsState } from "../../../lib/settingsDefaults";
import { MAX_BACKGROUND_BYTES, uploadSiteAsset, validateSiteAssetFile } from "../../../lib/siteAssetsStorage";

type Appearance = SettingsState["appearance"];

const DEFAULT_BACKGROUND_PREVIEW = "/dashboard-bg.jpg";

function BackgroundControl({ value, onChange }: { value: Appearance; onChange: (next: Appearance) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    const validationError = validateSiteAssetFile(file, MAX_BACKGROUND_BYTES);
    if (validationError) {
      setError(validationError);
      return;
    }
    setUploading(true);
    try {
      const { publicUrl } = await uploadSiteAsset("background", file);
      onChange({ ...value, backgroundUrl: publicUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Field label="Background" description="The dashboard's background image, behind every module. You'll see it change immediately — click Save changes to keep it, or Discard to revert.">
      <div className="flex items-start gap-3">
        <div
          className="h-20 w-32 shrink-0 rounded-lg border border-line bg-cover bg-center"
          style={{ backgroundImage: `url("${value.backgroundUrl || DEFAULT_BACKGROUND_PREVIEW}")` }}
        />
        <div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:border-brand hover:text-brand disabled:opacity-60"
            >
              {uploading ? "Uploading…" : value.backgroundUrl ? "Replace background" : "Upload background"}
            </button>
            {value.backgroundUrl && (
              <button
                type="button"
                disabled={uploading}
                onClick={() => onChange({ ...value, backgroundUrl: null })}
                className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink-soft hover:border-red-400 hover:text-red-600 disabled:opacity-60"
              >
                Remove background
              </button>
            )}
          </div>
          <p className="mt-1.5 text-xs text-ink-soft">{value.backgroundUrl ? "Custom background selected." : "Using the default Sellam dashboard background."}</p>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>
    </Field>
  );
}

export default function AppearanceSection({ value, onChange }: { value: Appearance; onChange: (next: Appearance) => void }) {
  return (
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
                      value.mode === opt.value ? "bg-brand border-brand text-white" : "border-line text-ink hover:border-ink-soft"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Field>
          <BackgroundControl value={value} onChange={onChange} />
        </section>

        <section className="pt-6">
          <h4 className="mb-1 text-sm font-semibold text-ink">Theme</h4>
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
          <Field label="Remember last sidebar state" description="When off, the sidebar always starts at the Sidebar style default above.">
            <Toggle checked={value.rememberSidebar} onChange={(v) => onChange({ ...value, rememberSidebar: v })} />
          </Field>
        </section>
    </div>
  );
}
