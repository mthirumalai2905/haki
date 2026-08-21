"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HermesStudio } from "@/components/hermes/HermesStudio";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import {
  SEQUENCE_TEMPLATES,
  templateChannels,
  templateSteps,
  type SequenceTemplate,
} from "@/lib/sequence/templates";
import { defaultWorkflow } from "@/lib/workflow/defaults";
import type { WorkflowGraph, WorkflowNodeData } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "templates" | "builder" | "library";
type Sequence = {
  id: string;
  name: string;
  latest?: { nodes: unknown[]; version: number } | null;
};

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "templates", label: "Templates" },
  { id: "builder", label: "Builder" },
  { id: "library", label: "Library" },
];

function stepKind(data: WorkflowNodeData) {
  if (data.type === "trigger") return "Start";
  if (data.type === "wait") return "Wait";
  if (data.type === "condition") return "Check";
  if (data.type === "end") return "End";
  return data.channel || "Action";
}

export function SequenceWorkspace() {
  const scroller = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>("templates");
  const [items, setItems] = useState<Sequence[]>([]);
  const [open, setOpen] = useState<SequenceTemplate | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowGraph | null>(null);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [seed, setSeed] = useState<{ name: string; workflow: WorkflowGraph } | null>(null);

  useEffect(() => {
    api<Sequence[]>("/api/workflows").then(setItems).catch(() => setItems([]));
  }, []);

  function scrollTo(id: string) {
    const root = scroller.current;
    const target = document.getElementById(id);
    if (!root || !target) return;
    root.scrollTo({ top: Math.max(0, target.offsetTop - 12), behavior: "smooth" });
  }

  function openTemplate(item: SequenceTemplate) {
    const next = {
      ...item.workflow,
      nodes: item.workflow.nodes.map((node) => ({ ...node, data: { ...node.data } })),
      edges: item.workflow.edges.map((edge) => ({ ...edge })),
    };
    setOpen(item);
    setName(item.name);
    setWorkflow(next);
    setSeed({ name: item.name, workflow: next });
    setEditing(false);
    setTab("templates");
    requestAnimationFrame(() => scrollTo("sequence-desk"));
  }

  function editInBuilder() {
    if (!workflow) return;
    setSeed({ name: name || open?.name || "Untitled sequence", workflow });
    setEditing(true);
    setTab("builder");
    requestAnimationFrame(() => scrollTo("sequence-desk"));
  }

  function newBlank() {
    const blank = defaultWorkflow();
    setOpen(null);
    setName("Untitled sequence");
    setWorkflow(blank);
    setSeed({ name: "Untitled sequence", workflow: blank });
    setEditing(true);
    setTab("builder");
    requestAnimationFrame(() => scrollTo("sequence-desk"));
  }

  function go(next: Tab) {
    setTab(next);
    if (next === "templates") requestAnimationFrame(() => scrollTo("sequence-templates"));
    if (next === "builder") {
      if (!workflow) newBlank();
      else {
        setEditing(true);
        requestAnimationFrame(() => scrollTo("sequence-desk"));
      }
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-2.5">
        <div className="flex rounded-md border border-line bg-paper p-0.5">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.id)}
              className={cn(
                "rounded px-3 py-1 text-xs capitalize",
                tab === item.id ? "bg-ink text-paper" : "text-muted",
              )}
            >
              {item.id === "library" ? `Library (${items.length})` : item.label}
            </button>
          ))}
        </div>
        {tab !== "library" ? (
          <Button variant="secondary" size="sm" onClick={newBlank}>
            Blank sequence
          </Button>
        ) : null}
      </div>

      {tab === "library" ? (
        <div className="min-h-0 flex-1 overflow-auto">
          <Library items={items} />
        </div>
      ) : (
        <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
          <div id="sequence-templates">
            <Gallery selected={open?.id} onOpen={openTemplate} />
          </div>
          <div id="sequence-desk" className="border-t border-line px-6 py-6">
            {workflow ? (
              editing ? (
                <div>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-faint">Builder</p>
                      <p className="mt-1 text-[13px] text-muted">
                        Templates stay above. Scroll up to pick another path.
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => go("templates")}>
                      Back to templates
                    </Button>
                  </div>
                  <HermesStudio
                    key={seed?.name ?? name}
                    kind="sequence"
                    seedName={seed?.name ?? name}
                    seedWorkflow={seed?.workflow ?? workflow}
                  />
                </div>
              ) : open ? (
                <Preview
                  template={open}
                  name={name}
                  workflow={workflow}
                  onName={setName}
                  onWorkflow={setWorkflow}
                  onBack={() => scrollTo("sequence-templates")}
                  onEdit={editInBuilder}
                />
              ) : null
            ) : (
              <p className="text-sm text-muted">Pick a template above, or start a blank sequence.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Gallery({ selected, onOpen }: { selected?: string; onOpen: (item: SequenceTemplate) => void }) {
  return (
    <div className="p-6">
      <p className="text-sm text-muted">Pick a sequence. Preview the path. Then edit the copy, the graph, or both.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-3">
        {SEQUENCE_TEMPLATES.map((item) => {
          const channels = templateChannels(item.workflow);
          const steps = templateSteps(item.workflow);
          const active = selected === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(item)}
              className={cn(
                "rounded-[16px] border bg-white px-4 py-4 text-left shadow-[0_8px_20px_rgba(29,29,31,0.04)]",
                active ? "border-ink" : "border-line hover:border-accent/40 hover:shadow-[0_12px_28px_rgba(0,122,255,0.08)]",
              )}
            >
              <div className="text-[15px] font-semibold tracking-[-0.022em]">{item.name}</div>
              <div className="mt-1 text-[13px] text-muted">{item.blurb}</div>
              <div className="mt-3 flex flex-wrap gap-1">
                {steps.slice(0, 5).map((step) => (
                  <span key={step.id} className="rounded-full bg-paper px-2 py-0.5 text-[10px] text-muted">
                    {step.data.label}
                  </span>
                ))}
                {steps.length > 5 ? <span className="text-[10px] text-faint">+{steps.length - 5}</span> : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {channels.map((channel) => (
                  <Badge key={channel} tone="info">
                    {channel}
                  </Badge>
                ))}
                <Badge tone="neutral">{steps.length} steps</Badge>
              </div>
              <div className="mt-3 text-[12px] leading-snug text-faint">{item.how}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Preview({
  template,
  name,
  workflow,
  onName,
  onWorkflow,
  onBack,
  onEdit,
}: {
  template: SequenceTemplate;
  name: string;
  workflow: WorkflowGraph;
  onName: (name: string) => void;
  onWorkflow: (workflow: WorkflowGraph) => void;
  onBack: () => void;
  onEdit: () => void;
}) {
  const steps = useMemo(() => templateSteps(workflow), [workflow]);
  const channels = useMemo(() => templateChannels(workflow), [workflow]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <button type="button" onClick={onBack} className="text-xs text-muted hover:text-ink">
            Back to templates
          </button>
          <input
            className="field mt-2 max-w-md"
            value={name}
            onChange={(event) => onName(event.target.value)}
          />
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
        <Button size="sm" onClick={onEdit}>
          Edit in chat
        </Button>
      </div>

      <div className="grid min-h-[560px] grid-cols-[280px_minmax(0,1fr)] gap-4">
        <div className="overflow-auto rounded-[16px] border border-line bg-[#f7f7fa] p-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-faint">Path</p>
          <div className="space-y-2">
            {steps.map((node, index) => (
              <div key={node.id} className="rounded-[12px] border border-line bg-white px-3 py-2.5 shadow-[0_6px_16px_rgba(29,29,31,0.04)]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-faint">{index + 1}</span>
                  <Badge tone="neutral">{stepKind(node.data)}</Badge>
                </div>
                <div className="mt-1 text-[13px] font-medium">{node.data.label}</div>
                {node.data.subject ? <div className="mt-1 text-[12px] text-muted">{node.data.subject}</div> : null}
                {node.data.body ? (
                  <div className="mt-1 line-clamp-3 whitespace-pre-wrap text-[12px] text-faint">{node.data.body}</div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <div className="min-h-[560px]">
          <WorkflowCanvas value={workflow} onChange={onWorkflow} />
        </div>
      </div>
    </div>
  );
}

function Library({ items }: { items: Sequence[] }) {
  if (items.length === 0) {
    return (
      <p className="p-6 text-sm text-muted">No saved sequences yet. Open a template, edit it, then save from the builder.</p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 p-6">
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
  );
}
