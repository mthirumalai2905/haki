"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { HermesStudio } from "@/components/hermes/HermesStudio";

export default function HermesPage() {
  const [kind, setKind] = useState<"campaign" | "sequence">("campaign");

  return (
    <AppShell
      title="Hermes"
      subtitle="Orchestrator and harnessing engine. DeepSeek reasons. You review."
      actions={
        <div className="flex rounded-md border border-line bg-paper p-0.5">
          {(["campaign", "sequence"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setKind(item)}
              className={`rounded px-3 py-1 text-xs ${kind === item ? "bg-ink text-paper" : "text-muted"}`}
            >
              {item}
            </button>
          ))}
        </div>
      }
    >
      <HermesStudio kind={kind} />
    </AppShell>
  );
}
