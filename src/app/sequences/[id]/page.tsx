"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SequenceNav } from "@/components/sequence/SequenceNav";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cloneWorkflow, getSequenceTemplate, templateChannels, templateSteps } from "@/lib/sequence/templates";
import { writeSequenceSeed } from "@/lib/sequence/seed";
import type { WorkflowNodeData } from "@/lib/types";

function stepKind(data: WorkflowNodeData) {
  if (data.type === "trigger") return "Start";
  if (data.type === "wait") return "Wait";
  if (data.type === "condition") return "Check";
  if (data.type === "end") return "End";
  return data.channel || "Action";
}

export default function SequenceTemplatePage() {
  const rawId = useParams<{ id: string }>().id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const router = useRouter();
  const template = getSequenceTemplate(id ?? "");
  const [name, setName] = useState(template?.name ?? "");
  const [workflow, setWorkflow] = useState(() => (template ? cloneWorkflow(template.workflow) : null));

  useEffect(() => {
    const next = getSequenceTemplate(id ?? "");
    if (!next) {
      setWorkflow(null);
      return;
    }
    setName(next.name);
    setWorkflow(cloneWorkflow(next.workflow));
  }, [id]);

  const steps = useMemo(() => (workflow ? templateSteps(workflow) : []), [workflow]);
  const channels = useMemo(() => (workflow ? templateChannels(workflow) : []), [workflow]);

  if (!template || !workflow) {
    return (
      <AppShell title="Template" subtitle="That starter is gone." actions={<SequenceNav />}>
        <p className="text-sm text-muted">Pick another path from Templates.</p>
        <Link href="/sequences" className="mt-3 inline-block text-sm text-accent hover:underline">
          All templates
        </Link>
      </AppShell>
    );
  }

  function openBuilder() {
    writeSequenceSeed({ name: name || template.name, workflow });
    router.push("/sequences/builder");
  }

  return (
    <AppShell
      flush
      title={template.name}
      subtitle="Preview this path. Edit the canvas, then open the builder."
      actions={<SequenceNav />}
    >
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto p-6">
        <div className="flex shrink-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <Link href="/sequences" className="text-xs text-muted hover:text-ink">
              All templates
            </Link>
            <input className="field mt-2 max-w-md" value={name} onChange={(event) => setName(event.target.value)} />
            <p className="mt-2 max-w-2xl text-[13px] text-muted">{template.how}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {channels.map((channel) => (
                <Badge key={channel} tone="info">
                  {channel}
                </Badge>
              ))}
              <Badge tone="neutral">Simulation</Badge>
            </div>
          </div>
          <Button size="sm" onClick={openBuilder}>
            Open builder
          </Button>
        </div>

        <div className="grid min-h-[560px] grid-cols-[280px_minmax(0,1fr)] gap-4">
          <div className="overflow-auto rounded-[16px] border border-line bg-[#f7f7fa] p-3">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-faint">Path</p>
            <div className="space-y-2">
              {steps.map((node, index) => (
                <div key={node.id} className="rounded-[12px] border border-line bg-white px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-faint">{index + 1}</span>
                    <Badge tone="neutral">{stepKind(node.data)}</Badge>
                  </div>
                  <div className="mt-1 text-[13px] font-medium">{node.data.label}</div>
                  {node.data.subject ? <div className="mt-1 text-[12px] text-muted">{node.data.subject}</div> : null}
                </div>
              ))}
            </div>
          </div>
          <div className="min-h-[560px]">
            <WorkflowCanvas value={workflow} onChange={setWorkflow} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
