import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export default function QuickActionTile({
  to,
  label,
  subtitle,
  icon,
}: {
  to: string;
  label: string;
  subtitle: string;
  icon: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="surface-glass flex items-center gap-4 rounded-2xl p-5 shadow-[0_8px_30px_rgba(15,23,42,0.1)]"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-white">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-base font-semibold text-ink">{label}</span>
        <span className="block text-sm text-ink">{subtitle}</span>
      </span>
    </Link>
  );
}
