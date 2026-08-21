"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SequenceNav } from "@/components/sequence/SequenceNav";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import Link from "next/link";

type Sequence = {
  id: string;
  name: string;
  latest?: { nodes: unknown[]; version: number } | null;
};

export default function SequenceLibraryPage() {
  const [items, setItems] = useState<Sequence[]>([]);

  useEffect(() => {
    api<Sequence[]>("/api/workflows").then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <AppShell
      title="Library"
      subtitle="Sequences you saved from the builder."
      actions={<SequenceNav libraryCount={items.length} />}
    >
      {items.length === 0 ? (
        <p className="text-sm text-muted">
          Nothing saved yet.{" "}
          <Link href="/sequences" className="text-accent hover:underline">
            Pick a template
          </Link>{" "}
          or{" "}
          <Link href="/sequences/builder" className="text-accent hover:underline">
            open the builder
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-[14px] border border-line bg-white px-4 py-4">
              <div className="text-sm font-medium">{item.name}</div>
              <div className="mt-2">
                <Badge tone="neutral">
                  {item.latest ? `${item.latest.nodes.length} nodes · v${item.latest.version}` : "No version"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
