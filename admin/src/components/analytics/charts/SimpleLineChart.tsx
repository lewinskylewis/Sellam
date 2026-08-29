import { useRef, useState } from "react";

export type SimplePoint = { key: string; label: string; date: Date; value: number | null };

const WIDTH = 900;
const HEIGHT = 200;
const PAD_LEFT = 40;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 26;

export default function SimpleLineChart({ data, color = "#1f3a63", valueLabel, valueFormat }: { data: SimplePoint[]; color?: string; valueLabel: string; valueFormat: (v: number) => string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const points = data.filter((d) => d.value != null);
  if (points.length === 0) {
    return <div className="flex h-[200px] items-center justify-center text-sm text-ink-soft">Not enough data to calculate this metric.</div>;
  }

  const values = points.map((p) => p.value as number);
  const maxValue = Math.max(...values) * 1.1;
  const minValue = Math.min(0, Math.min(...values));
  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const x = (i: number) => PAD_LEFT + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const y = (v: number) => PAD_TOP + plotH - ((v - minValue) / (maxValue - minValue || 1)) * plotH;

  const path = data
    .map((d, i) => (d.value == null ? null : `${i === 0 || data[i - 1]?.value == null ? "M" : "L"} ${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`))
    .filter(Boolean)
    .join(" ");

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
    <div ref={containerRef} className="relative" onMouseMove={handleMove} onMouseLeave={() => setHoverIndex(null)}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ height: HEIGHT }} role="img" aria-label={valueLabel}>
        <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {hoverIndex != null && data[hoverIndex].value != null && (
          <>
            <line x1={x(hoverIndex)} x2={x(hoverIndex)} y1={PAD_TOP} y2={PAD_TOP + plotH} stroke="rgba(20,32,51,0.2)" strokeWidth={1} />
            <circle cx={x(hoverIndex)} cy={y(data[hoverIndex].value as number)} r={3.5} fill={color} stroke="white" strokeWidth={1.4} />
          </>
        )}
        {data.length <= 12 &&
          data.map((d, i) => (
            <text key={d.key} x={x(i)} y={HEIGHT - 6} fontSize={10} fill="#6b7280" textAnchor="middle">
              {d.label}
            </text>
          ))}
        {data.length > 12 &&
          [0, Math.floor(data.length / 2), data.length - 1].map((i) => (
            <text key={i} x={x(i)} y={HEIGHT - 6} fontSize={10} fill="#6b7280" textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}>
              {data[i].label}
            </text>
          ))}
      </svg>
      {hovered && hovered.value != null && (
        <div
          className="pointer-events-none absolute top-1 z-10 min-w-[130px] rounded-lg border border-line bg-brand px-3 py-2 text-white shadow-lg"
          style={{
            left: tooltipAlign === "center" ? `${tooltipLeftPct}%` : tooltipAlign === "left" ? "0%" : undefined,
            right: tooltipAlign === "right" ? "0%" : undefined,
            transform: tooltipAlign === "center" ? "translateX(-50%)" : undefined,
          }}
        >
          <p className="text-xs font-semibold">{hovered.date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p>
          <p className="mt-1 text-xs text-white/90">
            {valueLabel}: {valueFormat(hovered.value)}
          </p>
        </div>
      )}
    </div>
  );
}
