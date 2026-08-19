"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { WorkflowGraph } from "@/lib/types";

export function AskHaki({
  goal,
  onApply,
}: {
  goal?: string;
  onApply: (graph: WorkflowGraph) => void;
}) {
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState("Create a 5 touch campaign for SaaS founders using email, LinkedIn and SMS. Stop if they reply.");
  const [pending, setPending] = useState<WorkflowGraph | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="absolute left-4 top-4 z-10 w-[360px] rounded-lg border border-line bg-surface p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Ask Haki</div>
        <button type="button" className="text-xs text-muted" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "Open"}
        </button>
      </div>
      {open ? (
        <div className="mt-3 space-y-3">
          <textarea
            className="field min-h-24"
            value={request}
            onChange={(event) => setRequest(event.target.value)}
          />
          <Button
            size="sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const graph = await api<WorkflowGraph>("/api/ai/workflow", {
                method: "POST",
                body: JSON.stringify({ request, goal }),
              });
              setPending(graph);
              setBusy(false);
            }}
          >
            {busy ? "Generating..." : "Generate workflow"}
          </Button>
          {pending ? (
            <div className="rounded-md border border-line p-3">
              <div className="text-sm">{pending.name}</div>
              <div className="mt-1 text-xs text-muted">{pending.nodes.length} nodes · Review before applying.</div>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    onApply(pending);
                    setPending(null);
                  }}
                >
                  Apply
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setPending(null)}>
                  Discard
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-1 text-xs text-muted">Describe a sequence. Haki will propose a workflow — never launch it for you.</p>
      )}
    </div>
  );
}
