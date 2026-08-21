"use client";

import { Component, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { HermesChat } from "./HermesChat";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { defaultWorkflow, actionNodes } from "@/lib/workflow/defaults";
import { overlayWorkflow } from "@/lib/workflow/revise";
import type { Audience, CampaignGoal, WorkflowGraph } from "@/lib/types";
import type { HermesProposal } from "@/lib/hermes/types";

export function HermesStudio({
  kind,
  seedName,
  seedWorkflow,
}: {
  kind: "campaign" | "sequence";
  seedName?: string;
  seedWorkflow?: WorkflowGraph;
}) {
  const router = useRouter();
  const [name, setName] = useState(seedName || (kind === "campaign" ? "Fried shop outreach" : "Untitled sequence"));
  const [goal, setGoal] = useState<CampaignGoal>("book_meetings");
  const [audience, setAudience] = useState<Audience>({ type: "all" });
  const [workflow, setWorkflow] = useState<WorkflowGraph>(seedWorkflow ?? defaultWorkflow());
  const [messages, setMessages] = useState<HermesProposal["messages"]>([]);
  const [saving, setSaving] = useState(false);

  const channels = useMemo(
    () => Array.from(new Set(actionNodes(workflow).map((node) => node.data.channel).filter(Boolean))),
    [workflow],
  );

  function applyProposal(proposal: HermesProposal) {
    if (proposal.name) setName(proposal.name);
    if (proposal.goal) setGoal(proposal.goal);
    if (proposal.audience) setAudience(proposal.audience);
    if (proposal.workflow) {
      setWorkflow((current) => overlayWorkflow(current, proposal.workflow!));
    }
    if (proposal.messages) setMessages(proposal.messages);
  }

  async function save(launch: boolean) {
    setSaving(true);
    if (kind === "sequence") {
      const created = await api<{ id: string }>("/api/workflows", {
        method: "POST",
        body: JSON.stringify({
          name,
          description: "Drafted by Hermes",
          nodes: workflow.nodes,
          edges: workflow.edges,
        }),
      });
      setSaving(false);
      router.push("/sequences/library");
      return;
    }

    const created = await api<{ id: string }>("/api/campaigns", {
      method: "POST",
      body: JSON.stringify({
        name,
        goal,
        audience,
        channels,
        workflow,
        messages: messages?.length
          ? messages
          : actionNodes(workflow).map((node) => ({
              nodeId: node.id,
              channel: node.data.channel || "email",
              subject: node.data.subject,
              body: node.data.body || "",
            })),
      }),
    });
    if (launch) {
      await api(`/api/campaigns/${created.id}/launch`, { method: "POST" });
    }
    setSaving(false);
    router.push(`/campaigns/${created.id}`);
  }

  return (
    <div className="grid h-full min-h-[520px] grid-cols-[360px_minmax(0,1fr)] gap-4">
      <HermesChat
        kind={kind}
        current={{
          kind,
          name,
          goal,
          audience,
          channels: channels as HermesProposal["channels"],
          workflow,
          messages,
        }}
        onProposal={applyProposal}
      />
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-center gap-3 rounded-[14px] border border-line bg-white px-4 py-3 shadow-[0_8px_20px_rgba(29,29,31,0.04)]">
          <input className="field max-w-sm" value={name} onChange={(event) => setName(event.target.value)} />
          {kind === "campaign" ? (
            <select className="field max-w-[180px]" value={goal} onChange={(event) => setGoal(event.target.value as CampaignGoal)}>
              <option value="book_meetings">Book meetings</option>
              <option value="generate_replies">Generate replies</option>
              <option value="start_conversations">Start conversations</option>
              <option value="drive_website_visits">Drive visits</option>
            </select>
          ) : null}
          <Badge tone="info">{channels.join(" · ") || "No channels"}</Badge>
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" size="sm" disabled={saving} onClick={() => save(false)}>
              Save draft
            </Button>
            {kind === "campaign" ? (
              <Button size="sm" disabled={saving} onClick={() => save(true)}>
                Launch simulated
              </Button>
            ) : null}
          </div>
        </div>
        <p className="text-xs text-muted">
          {kind === "sequence"
            ? "Chat edits this canvas. Templates live on their own page. Waits and conditions stay unless you ask to remove them."
            : "Chat edits retarget nodes on this canvas. Waits, conditions, and later touches stay unless you ask to remove them."}
        </p>
        <div className="min-h-0 flex-1">
          <CanvasGuard>
            <WorkflowCanvas value={workflow} onChange={setWorkflow} goal={goal} />
          </CanvasGuard>
        </div>
      </div>
    </div>
  );
}

class CanvasGuard extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex h-full min-h-[560px] items-center justify-center rounded-[14px] border border-line bg-white text-sm text-muted">
          Canvas hit a snag. Chat still works — ask Hermes to draft, then refresh to edit the workflow.
        </div>
      );
    }
    return this.props.children;
  }
}
