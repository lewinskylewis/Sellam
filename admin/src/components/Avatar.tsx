const PALETTE = ["#3FA65A", "#7C4DDA", "#E2662E", "#C9A227", "#2E86AB", "#C4497A"];

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export default function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-medium text-white"
      style={{ width: size, height: size, backgroundColor: colorFor(name || "?"), fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  );
}
