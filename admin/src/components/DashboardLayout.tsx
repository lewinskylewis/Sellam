import { useState, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import { MenuIcon } from "./icons";

function MobileTopBar({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="flex items-center gap-3 bg-brand px-5 py-4 text-white md:hidden">
      <button
        type="button"
        onClick={onOpen}
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10"
      >
        <MenuIcon className="h-5 w-5" />
      </button>
      <span className="font-serif text-xl tracking-[0.08em] uppercase">Sellam</span>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth >= 768,
  );

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar onOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 px-5 py-8 md:px-10 md:py-10">{children}</main>
      </div>
    </div>
  );
}
