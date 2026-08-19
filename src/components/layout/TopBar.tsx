"use client";

import { PanelLeft, PanelLeftClose, Search } from "lucide-react";
import { useShell } from "./shell-context";

export function TopBar({
  title,
  subtitle,
  actions,
  onSearch,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onSearch?: () => void;
}) {
  const { navOpen, toggleNav } = useShell();

  return (
    <header className="glass flex h-12 shrink-0 items-center justify-between border-b border-line px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={toggleNav}
          title={navOpen ? "Hide navigation" : "Show navigation"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-muted hover:bg-[#f2f2f7] hover:text-ink"
        >
          {navOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-semibold tracking-[-0.022em] text-ink">{title}</h1>
          {subtitle ? <p className="truncate text-[12px] text-muted">{subtitle}</p> : null}
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        {actions}
        <button
          type="button"
          onClick={onSearch}
          className="flex h-8 w-56 items-center gap-2 rounded-[9px] bg-[#f2f2f7] px-2.5 text-[12px] text-faint"
        >
          <Search className="h-3.5 w-3.5" />
          Search
          <span className="ml-auto text-[11px] text-faint">⌘K</span>
        </button>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8e8ed] text-[10px] font-semibold text-ink">
          HK
        </div>
      </div>
    </header>
  );
}
