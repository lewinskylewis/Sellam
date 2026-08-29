export type BarListItem = { label: string; value: number; sublabel?: string; onClick?: () => void };

export default function BarList({ items, valueFormat, color = "#1f3a63" }: { items: BarListItem[]; valueFormat: (v: number) => string; color?: string }) {
  if (items.length === 0) {
    return <div className="flex h-24 items-center justify-center text-sm text-ink-soft">No data available for this period.</div>;
  }
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className={item.onClick ? "font-medium text-ink hover:text-link" : "font-medium text-ink"}>
              {item.onClick ? (
                <button type="button" onClick={item.onClick} className="hover:underline">
                  {item.label}
                </button>
              ) : (
                item.label
              )}
              {item.sublabel && <span className="ml-1.5 text-xs font-normal text-ink-soft">{item.sublabel}</span>}
            </span>
            <span className="shrink-0 tabular-nums text-ink-soft">{valueFormat(item.value)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-paper">
            <div className="h-full rounded-full transition-[width]" style={{ width: `${(item.value / max) * 100}%`, backgroundColor: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}
