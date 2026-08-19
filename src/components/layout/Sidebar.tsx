"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bot,
  Layers3,
  LayoutGrid,
  MessageSquare,
  PanelLeftClose,
  Settings,
  Users,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useShell } from "./shell-context";

const items = [
  { href: "/haki", label: "Haki AI", icon: MessageSquare },
  { href: "/overview", label: "Overview", icon: LayoutGrid },
  { href: "/hermes", label: "Hermes", icon: Bot },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/campaigns", label: "Campaigns", icon: Layers3 },
  { href: "/sequences", label: "Sequences", icon: Workflow },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggleNav } = useShell();

  return (
    <aside className="relative z-30 flex w-[220px] shrink-0 flex-col bg-sidebar">
      <div className="flex h-12 items-center justify-between px-3.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57] ring-1 ring-black/10" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e] ring-1 ring-black/10" />
            <span className="h-3 w-3 rounded-full bg-[#28c840] ring-1 ring-black/10" />
          </div>
          <div className="text-[13px] font-semibold tracking-[-0.02em] text-ink">Haki</div>
        </div>
        <button
          type="button"
          onClick={toggleNav}
          title="Hide navigation"
          className="flex h-7 w-7 items-center justify-center rounded-[7px] text-faint hover:bg-white hover:text-ink"
        >
          <PanelLeftClose className="h-3.5 w-3.5" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2 pt-1">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              onClick={(event) => {
                event.preventDefault();
                router.push(item.href);
              }}
              className={cn(
                "relative z-10 flex items-center gap-2.5 rounded-[8px] px-2.5 py-1.5 text-[13px]",
                active ? "bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]" : "text-muted hover:bg-white/60 hover:text-ink",
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", active ? "text-accent" : "")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-3">
        <div className="mb-2 rounded-[10px] bg-white/70 px-2.5 py-2">
          <div className="text-[10px] font-medium text-faint">Mode</div>
          <div className="mt-0.5 text-[12px] text-accent">Simulation</div>
        </div>
        <Link
          href="/settings"
          prefetch
          onClick={(event) => {
            event.preventDefault();
            router.push("/settings");
          }}
          className={cn(
            "flex items-center gap-2.5 rounded-[8px] px-2.5 py-1.5 text-[13px]",
            pathname.startsWith("/settings")
              ? "bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              : "text-muted hover:bg-white/60 hover:text-ink",
          )}
        >
          <Settings className="h-3.5 w-3.5" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
