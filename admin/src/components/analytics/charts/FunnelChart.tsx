import type { FunnelConversion, FunnelStep } from "../../../lib/analyticsData";

export default function FunnelChart({ steps, conversions }: { steps: FunnelStep[]; conversions: FunnelConversion[] }) {
  const max = Math.max(1, ...steps.map((s) => s.count));

  return (
    <div className="space-y-1">
      {steps.map((step, i) => {
        const widthPct = Math.max(6, (step.count / max) * 100);
        const conversion = i > 0 ? conversions[i - 1] : null;
        return (
          <div key={step.stage}>
            {conversion && (
              <div className="flex items-center gap-2 py-1 pl-1 text-xs text-ink-soft">
                <span className="text-base leading-none">↓</span>
                <span>
                  {conversion.from} → {conversion.to}
                </span>
                <span className={`font-semibold ${conversion.rate != null && conversion.rate < 40 ? "text-rose-600" : "text-ink"}`}>
                  {conversion.rate != null ? `${conversion.rate.toFixed(0)}%` : "—"}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-lg bg-paper/70 p-0.5">
                <div
                  className="flex items-center justify-between rounded-md bg-brand px-3 py-2.5 text-white transition-[width]"
                  style={{ width: `${widthPct}%`, backgroundImage: "linear-gradient(135deg, #101a2e 0%, #1f3a63 55%, #2c4a7c 100%)" }}
                >
                  <span className="text-xs font-medium tracking-wide uppercase">{step.stage}</span>
                  <span className="text-sm font-semibold tabular-nums">{step.count}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
