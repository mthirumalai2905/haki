"use client";

import { TopBar } from "./TopBar";
import { useSearchPalette } from "./shell-context";
import { cn } from "@/lib/utils";

export function AppShell({
  title,
  subtitle,
  actions,
  children,
  flush,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  flush?: boolean;
}) {
  const { openSearch } = useSearchPalette();

  return (
    <>
      <TopBar title={title} subtitle={subtitle} actions={actions} onSearch={openSearch} />
      <main
        className={cn(
          "min-h-0 flex-1 bg-white",
          flush ? "flex flex-col overflow-hidden" : "overflow-auto p-6",
        )}
      >
        {children}
      </main>
    </>
  );
}
