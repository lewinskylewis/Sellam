import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { displayName, useAuth } from "../lib/auth";
import { usePreferences } from "../lib/PreferencesContext";
import Avatar from "./Avatar";
import {
  ChatIcon,
  ChartIcon,
  ChevronDownIcon,
  CommunityIcon,
  GearIcon,
  GridIcon,
  HouseIcon,
  MailIcon,
  MenuIcon,
  UsersIcon,
} from "./icons";

const NAV_ITEMS: { label: string; to: string; enabled: boolean; icon: ComponentType<{ className?: string }> }[] = [
  { label: "Overview", to: "/", enabled: true, icon: GridIcon },
  { label: "Properties", to: "/properties", enabled: true, icon: HouseIcon },
  { label: "Communities", to: "/communities", enabled: true, icon: CommunityIcon },
  { label: "Enquiries", to: "/enquiries", enabled: true, icon: ChatIcon },
  { label: "Leads & Clients", to: "/leads", enabled: true, icon: UsersIcon },
  { label: "Analytics", to: "/analytics", enabled: true, icon: ChartIcon },
  { label: "Messages", to: "/messages", enabled: true, icon: MailIcon },
  { label: "Settings", to: "/settings", enabled: true, icon: GearIcon },
];

export default function Sidebar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { session, signOut } = useAuth();
  const { accessibility } = usePreferences();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const name = displayName(session);

  // Lightweight, real keyboard navigation: Alt+1..8 jumps straight to each
  // nav item — not a large shortcut system, just enough to make the
  // "Keyboard navigation hints" setting mean something concrete. Hints
  // (the little Alt+N badges) only render when the setting is on; the
  // shortcuts themselves stay active either way, same as a browser's own
  // always-on accelerator keys.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      const index = Number(e.key) - 1;
      const item = NAV_ITEMS[index];
      if (!item || !item.enabled) return;
      e.preventDefault();
      navigate(item.to);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar-glass fixed inset-y-4 left-4 z-40 flex w-64 flex-col rounded-3xl text-white shadow-2xl transition-transform duration-200 ease-in-out md:static md:inset-auto md:z-0 md:my-4 md:ml-4 md:transition-[width] ${
          open ? "translate-x-0 md:w-64" : "-translate-x-full md:w-20 md:translate-x-0"
        }`}
      >
        <div className={`flex items-center py-7 ${open ? "justify-between px-6" : "justify-center px-2 md:px-0"}`}>
          {open && <img src="/sellam-logo.png" alt="Sellam" className="h-7 w-auto" />}
          <button
            type="button"
            onClick={onToggle}
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
            title={accessibility.tooltips ? (open ? "Collapse sidebar" : "Expand sidebar") : undefined}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-4">
          {NAV_ITEMS.map((item, i) => {
            const Icon = item.icon;
            const content = (
              <span className={`flex items-center gap-3 ${open ? "" : "md:justify-center"}`}>
                <Icon className="h-5 w-5 shrink-0" />
                <span className={open ? "inline" : "inline md:hidden"}>{item.label}</span>
              </span>
            );

            // Collapsed: hovering shows the item's name (native title
            // tooltip), since the label text itself is hidden. Expanded:
            // the label is already visible, so hovering instead surfaces
            // the Alt+N shortcut as a tooltip rather than a permanently
            // visible badge — the two never show at the same time, so they
            // can't collide with each other.
            const hoverTitle = !open ? (accessibility.tooltips ? item.label : undefined) : accessibility.keyboardNav ? `Alt+${i + 1}` : undefined;

            return item.enabled ? (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                title={hoverTitle}
                style={{ paddingTop: "var(--density-nav-py)", paddingBottom: "var(--density-nav-py)" }}
                className={({ isActive }) =>
                  `block rounded-xl px-4 text-[15px] font-medium transition-colors ${
                    isActive ? "bg-white/95 text-brand" : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {content}
              </NavLink>
            ) : (
              <div
                key={item.to}
                title="Coming in a future phase"
                style={{ paddingTop: "var(--density-nav-py)", paddingBottom: "var(--density-nav-py)" }}
                className="cursor-not-allowed rounded-xl px-4 text-[15px] font-medium text-white/40"
              >
                {content}
              </div>
            );
          })}
        </nav>

        <div className="relative border-t border-white/10 px-4 py-4">
          {menuOpen && (
            <div className="absolute bottom-full left-2 mb-2 w-44 overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
              <button
                type="button"
                onClick={() => signOut()}
                className="block w-full px-4 py-3 text-left text-sm font-medium text-ink hover:bg-paper"
              >
                Log out
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-white/10 ${
              open ? "" : "md:justify-center"
            }`}
          >
            <Avatar name={name} size={40} />
            <span className={`min-w-0 flex-1 ${open ? "" : "md:hidden"}`}>
              <span className="block truncate text-sm font-semibold text-white">{name}</span>
              <span className="block text-xs text-white/60">Administrator</span>
            </span>
            <ChevronDownIcon
              className={`h-4 w-4 shrink-0 text-white/60 transition-transform ${menuOpen ? "rotate-180" : ""} ${
                open ? "" : "md:hidden"
              }`}
            />
          </button>
        </div>
      </aside>
    </>
  );
}
