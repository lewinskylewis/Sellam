const SYSTEM_INFO: { label: string; value: string }[] = [
  { label: "Dashboard version", value: "2.4.0" },
  { label: "Build", value: "2026.08.29-101009a" },
  { label: "Environment", value: "Production" },
  { label: "Last updated", value: "29 Aug 2026" },
  { label: "Browser", value: typeof navigator !== "undefined" ? navigator.userAgent.split(") ")[0].split(" (")[0] : "Unknown" },
  { label: "Device", value: typeof navigator !== "undefined" && /Mobi/i.test(navigator.userAgent) ? "Mobile" : "Desktop" },
];

const STATUS_ROWS: { label: string; status: "operational" | "degraded" | "down" }[] = [
  { label: "Dashboard", status: "operational" },
  { label: "Database", status: "operational" },
  { label: "Storage", status: "operational" },
  { label: "Messaging", status: "operational" },
  { label: "Notifications", status: "operational" },
];

const STATUS_STYLES: Record<(typeof STATUS_ROWS)[number]["status"], string> = {
  operational: "bg-emerald-50 text-emerald-700",
  degraded: "bg-amber-50 text-amber-800",
  down: "bg-red-50 text-red-700",
};

function localStorageStatus() {
  try {
    const testKey = "__sellam_storage_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return "Available";
  } catch {
    return "Unavailable";
  }
}

export default function SystemSection() {
  return (
    <div className="divide-y divide-line">
      <section>
        <h4 className="mb-3 text-sm font-semibold text-ink">System Information</h4>
        <p className="mb-3 text-xs text-ink-soft">Read-only. These values are illustrative and not fetched from a live service.</p>
        <div className="overflow-hidden rounded-xl border border-line">
          {[...SYSTEM_INFO, { label: "Local storage", value: localStorageStatus() }, { label: "Application status", value: "Running" }].map((row, i) => (
            <div key={row.label} className={`flex items-center justify-between px-4 py-2.5 text-sm ${i % 2 === 0 ? "bg-white" : "bg-paper/50"}`}>
              <span className="text-ink-soft">{row.label}</span>
              <span className="font-medium text-ink">{row.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="pt-6">
        <h4 className="mb-3 text-sm font-semibold text-ink">System Status</h4>
        <p className="mb-3 text-xs text-ink-soft">Visual status indicators only — no live connectivity checks are performed.</p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {STATUS_ROWS.map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-lg border border-line px-4 py-3">
              <span className="text-sm font-medium text-ink">{row.label}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[row.status]}`}>
                {row.status === "operational" ? "Operational" : row.status === "degraded" ? "Degraded" : "Down"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
