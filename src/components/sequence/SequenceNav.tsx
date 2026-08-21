"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/sequences", label: "Templates", id: "templates" },
  { href: "/sequences/builder", label: "Builder", id: "builder" },
  { href: "/sequences/library", label: "Library", id: "library" },
] as const;

function activeId(pathname: string) {
  if (pathname.startsWith("/sequences/builder")) return "builder";
  if (pathname.startsWith("/sequences/library")) return "library";
  return "templates";
}

export function SequenceNav({ libraryCount }: { libraryCount?: number }) {
  const pathname = usePathname();
  const current = activeId(pathname);

  return (
    <div className="flex rounded-md border border-line bg-paper p-0.5">
      {ITEMS.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={cn(
            "rounded px-3 py-1 text-xs",
            current === item.id ? "bg-ink text-paper" : "text-muted hover:text-ink",
          )}
        >
          {item.id === "library" && libraryCount != null ? `Library (${libraryCount})` : item.label}
        </Link>
      ))}
    </div>
  );
}
