"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { HermesStudio } from "@/components/hermes/HermesStudio";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";

type Sequence = {
  id: string;
  name: string;
  latest?: { nodes: unknown[]; version: number } | null;
};

export default function SequencesPage() {
  const [items, setItems] = useState<Sequence[]>([]);
  const [mode, setMode] = useState<"build" | "library">("build");

  useEffect(() => {
    api<Sequence[]>("/api/workflows").then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <AppShell
      title="Sequences"
      subtitle="Reusable workflows, drafted in chat and edited on the canvas."
      actions={
        <button
          type="button"
          onClick={() => setMode(mode === "build" ? "library" : "build")}
          className="text-xs text-muted hover:text-ink"
        >
          {mode === "build" ? `Library (${items.length})` : "Back to Hermes"}
        </button>
      }
    >
      {mode === "build" ? (
        <HermesStudio kind="sequence" />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">No saved sequences yet. Ask Hermes to draft one, then save.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-line bg-surface px-4 py-4">
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
