import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

// __SELLAM_BUILD_*__ are injected by vite.config.ts's `define` from
// Vercel's build-time env vars (VERCEL_GIT_COMMIT_SHA / VERCEL_ENV) — null
// when not building on Vercel (e.g. `npm run dev`), never a fabricated
// value.
const SYSTEM_INFO: { label: string; value: string }[] = [
  { label: "Build", value: __SELLAM_BUILD_SHA__ ?? "Not built on Vercel (local dev)" },
  { label: "Environment", value: __SELLAM_BUILD_ENV__ ? __SELLAM_BUILD_ENV__[0].toUpperCase() + __SELLAM_BUILD_ENV__.slice(1) : "Development" },
  { label: "Last built", value: new Date(__SELLAM_BUILD_TIME__).toLocaleString() },
  { label: "Browser", value: typeof navigator !== "undefined" ? navigator.userAgent.split(") ")[0].split(" (")[0] : "Unknown" },
  { label: "Device", value: typeof navigator !== "undefined" && /Mobi/i.test(navigator.userAgent) ? "Mobile" : "Desktop" },
];

type Status = "operational" | "degraded" | "down" | "unmonitored";

const STATUS_STYLES: Record<Status, string> = {
  operational: "bg-emerald-50 text-emerald-700",
  degraded: "bg-amber-50 text-amber-800",
  down: "bg-red-50 text-red-700",
  unmonitored: "bg-paper text-ink-soft",
};

const STATUS_LABELS: Record<Status, string> = {
  operational: "Operational",
  degraded: "Degraded",
  down: "Unreachable",
  unmonitored: "Not monitored",
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

// Services this dashboard genuinely has no way to check from the browser —
// shown honestly as "Not monitored" rather than a fabricated "Operational".
// See the Settings audit: real checks for these would need either
// server-side infrastructure (Storage/Messaging) or a delivery system that
// doesn't exist yet (Notifications).
const UNMONITORED_SERVICES = ["Storage", "Messaging", "Notifications"];

export default function SystemSection() {
  const [dbStatus, setDbStatus] = useState<Status>("unmonitored");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setChecking(true);
    // Lightweight real connectivity check — a cheap, always-accessible
    // table this admin session already has SELECT on (RLS is not what's
    // being tested here, just whether Supabase responds at all).
    (async () => {
      const { error } = await supabase.from("admin_settings").select("id", { head: true, count: "exact" });
      if (cancelled) return;
      setDbStatus(error ? "down" : "operational");
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const statusRows: { label: string; status: Status }[] = [
    { label: "Dashboard", status: "operational" }, // trivially true — this code is running
    { label: "Database", status: checking ? "unmonitored" : dbStatus },
    ...UNMONITORED_SERVICES.map((label) => ({ label, status: "unmonitored" as Status })),
  ];

  return (
    <div className="divide-y divide-line">
      <section>
        <h4 className="mb-3 text-sm font-semibold text-ink">System Information</h4>
        <div className="overflow-hidden rounded-xl border border-line">
          {[...SYSTEM_INFO, { label: "Local storage", value: localStorageStatus() }].map((row, i) => (
            <div key={row.label} className={`flex items-center justify-between px-4 py-2.5 text-sm ${i % 2 === 0 ? "bg-white" : "bg-paper/50"}`}>
              <span className="text-ink-soft">{row.label}</span>
              <span className="font-medium text-ink">{row.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="pt-6">
        <h4 className="mb-3 text-sm font-semibold text-ink">System Status</h4>
        <p className="mb-3 text-xs text-ink-soft">Database is checked live against Supabase. Services this dashboard cannot check from the browser are labeled "Not monitored" rather than assumed operational.</p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {statusRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-lg border border-line px-4 py-3">
              <span className="text-sm font-medium text-ink">{row.label}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[row.status]}`}>{checking && row.label === "Database" ? "Checking…" : STATUS_LABELS[row.status]}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
