import { useRef, useState } from "react";
import type { SeriesPoint } from "../../../lib/analyticsData";

type SeriesKey = "enquiries" | "leads" | "viewings";

const SERIES_META: { key: SeriesKey; label: string; color: string }[] = [
  { key: "enquiries", label: "Enquiries", color: "#1f3a63" },
  { key: "leads", label: "Leads", color: "#b08d57" },
  { key: "viewings", label: "Viewings", color: "#3b5bdb" },
];

const WIDTH = 900;
const HEIGHT = 260;
const PAD_LEFT = 36;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

export default function LineAreaChart({ data }: { data: SeriesPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({ enquiries: true, leads: true, viewings: true });

  if (data.length === 0) {
    return <div className="flex h-[260px] items-center justify-center text-sm text-ink-soft">No analytics data available for this period.</div>;
  }

  const maxValue = Math.max(1, ...data.map((d) => Math.max(d.enquiries, d.leads, d.viewings)));
  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const x = (i: number) => PAD_LEFT + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const y = (v: number) => PAD_TOP + plotH - (v / maxValue) * plotH;

  function pathFor(key: SeriesKey) {
    return data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d[key]).toFixed(1)}`).join(" ");
  }

  function areaFor(key: SeriesKey) {
    const line = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d[key]).toFixed(1)}`).join(" ");
    return `${line} L ${x(data.length - 1).toFixed(1)} ${y(0).toFixed(1)} L ${x(0).toFixed(1)} ${y(0).toFixed(1)} Z`;
  }

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxValue * f));

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let bestDist = Infinity;
    data.forEach((_, i) => {
      const dist = Math.abs(x(i) - relX);
      if (dist < bestDist) {
        bestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  const hovered = hoverIndex != null ? data[hoverIndex] : null;
  const tooltipLeftPct = hoverIndex != null ? (x(hoverIndex) / WIDTH) * 100 : 0;
  const tooltipAlign = tooltipLeftPct > 70 ? "right" : tooltipLeftPct < 15 ? "left" : "center";

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4">
        {SERIES_META.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setVisible((v) => ({ ...v, [s.key]: !v[s.key] }))}
            className={`flex items-center gap-1.5 text-xs font-medium transition-opacity ${visible[s.key] ? "opacity-100" : "opacity-35"}`}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-ink">{s.label}</span>
          </button>
        ))}
      </div>

      <div ref={containerRef} className="relative" onMouseMove={handleMove} onMouseLeave={() => setHoverIndex(null)}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ height: HEIGHT }} role="img" aria-label="Enquiry activity over time">
          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y(t)} y2={y(t)} stroke="rgba(100,116,139,0.14)" strokeWidth={1} />
              <text x={4} y={y(t) + 3} fontSize={10} fill="#6b7280">
                {t}
              </text>
            </g>
          ))}

          {visible.enquiries && (
            <path d={areaFor("enquiries")} fill="url(#enquiryFill)" opacity={0.5} />
          )}
          <defs>
            <linearGradient id="enquiryFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1f3a63" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#1f3a63" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {SERIES_META.filter((s) => visible[s.key]).map((s) => (
            <path key={s.key} d={pathFor(s.key)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          ))}

          {hoverIndex != null && (
            <line x1={x(hoverIndex)} x2={x(hoverIndex)} y1={PAD_TOP} y2={PAD_TOP + plotH} stroke="rgba(20,32,51,0.25)" strokeWidth={1} />
          )}
          {hoverIndex != null &&
            SERIES_META.filter((s) => visible[s.key]).map((s) => (
              <circle key={s.key} cx={x(hoverIndex)} cy={y(data[hoverIndex][s.key])} r={3.2} fill={s.color} stroke="white" strokeWidth={1.2} />
            ))}

          {data.length <= 14 &&
            data.map((d, i) => (
              <text key={d.key} x={x(i)} y={HEIGHT - 8} fontSize={10} fill="#6b7280" textAnchor="middle">
                {d.label}
              </text>
            ))}
          {data.length > 14 &&
            [0, Math.floor(data.length / 2), data.length - 1].map((i) => (
              <text key={i} x={x(i)} y={HEIGHT - 8} fontSize={10} fill="#6b7280" textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}>
                {data[i].label}
              </text>
            ))}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-[150px] rounded-lg border border-line bg-brand px-3 py-2 text-white shadow-lg"
            style={{
              left: tooltipAlign === "center" ? `${tooltipLeftPct}%` : tooltipAlign === "left" ? "0%" : undefined,
              right: tooltipAlign === "right" ? "0%" : undefined,
              transform: tooltipAlign === "center" ? "translateX(-50%)" : undefined,
            }}
          >
            <p className="text-xs font-semibold">{hovered.date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p>
            <div className="mt-1.5 space-y-0.5 text-xs text-white/90">
              <p>Enquiries: {hovered.enquiries}</p>
              <p>Leads: {hovered.leads}</p>
              <p>Viewings: {hovered.viewings}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
