import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "./icons";

export default function ComingSoonPage({
  title,
  subtitle,
  icon,
  description,
  upcomingFeatures,
  extra,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  description: string;
  upcomingFeatures: string[];
  extra?: ReactNode;
}) {
  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-link hover:underline">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Overview
      </Link>

      <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink">{title}</h1>
      <p className="mt-1 text-ink">{subtitle}</p>

      <section className="mt-6 rounded-2xl border border-line bg-surface p-10 text-center shadow-[0_8px_30px_rgba(15,23,42,0.14)]">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white">
          {icon}
        </span>

        <span
          className="mt-5 inline-block rounded-full px-3 py-1 text-xs font-medium"
          style={{ backgroundColor: "var(--color-status-amber-bg)", color: "var(--color-status-amber-text)" }}
        >
          Coming Soon
        </span>

        <p className="mx-auto mt-4 max-w-md text-sm text-ink">{description}</p>

        <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-ink">
          {upcomingFeatures.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {feature}
            </li>
          ))}
        </ul>

        {extra && <div className="mt-6">{extra}</div>}
      </section>
    </div>
  );
}
