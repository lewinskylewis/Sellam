import { useEffect, useState, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import { MenuIcon } from "./icons";
import { usePreferences } from "../lib/PreferencesContext";
import { loadSidebarState, saveSidebarState, clearSidebarState } from "../lib/preferences";

function MobileTopBar({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="sidebar-glass sticky top-0 z-20 flex items-center gap-3 px-5 py-4 text-white md:hidden">
      <button
        type="button"
        onClick={onOpen}
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10"
      >
        <MenuIcon className="h-5 w-5" />
      </button>
      <img src="/sellam-logo.png" alt="Sellam" className="h-6 w-auto" />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { appearance } = usePreferences();

  // Initial state: on mobile, always start closed regardless of preference
  // (existing behavior). On desktop, "Remember sidebar" takes precedence
  // over the "Sidebar style" default when a remembered value exists;
  // otherwise "Sidebar style" (expanded/collapsed) is the default.
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return false;
    if (appearance.rememberSidebar) {
      const remembered = loadSidebarState();
      if (remembered !== null) return remembered;
    }
    return appearance.sidebarStyle !== "collapsed";
  });

  // If "Remember sidebar" is turned off, forget whatever was previously
  // stored so a later re-enable doesn't resurrect a stale state.
  useEffect(() => {
    if (!appearance.rememberSidebar) clearSidebarState();
  }, [appearance.rememberSidebar]);

  function toggleSidebar() {
    setSidebarOpen((v) => {
      const next = !v;
      if (appearance.rememberSidebar) saveSidebarState(next);
      return next;
    });
  }

  return (
    // h-screen + overflow-hidden locks the viewport so the sidebar (a
    // sibling that sits outside the scrollable column below) never moves —
    // only the content column scrolls, independent of the sidebar.
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onToggle={toggleSidebar} />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <MobileTopBar onOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 px-5 py-8 md:px-[var(--density-content-px)] md:py-[var(--density-content-py)]">{children}</main>
      </div>
    </div>
  );
}
