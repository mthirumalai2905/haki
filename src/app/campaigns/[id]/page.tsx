"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Metric } from "@/components/ui/Metric";
import { SequenceDesk } from "@/components/sequence/SequenceDesk";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import { api } from "@/lib/api";
import { formatNumber, formatPercent, formatRelative, titleCase } from "@/lib/utils";
import type { WorkflowGraph } from "@/lib/types";

type CampaignDetail = {
  id: string;
  name: string;
  goal: string;
  status: string;
  sendMode?: string;
  sendAt?: string | null;
  channels: string[];
  workflow: WorkflowGraph & { version?: number };
  metrics: {
    leadsContacted: number;
    messagesSent: number;
    openRate: number;
    replyRate: number;
    meetings: number;
  };
  campaignLeads: Array<{
    id: string;
    status: string;
    currentNodeId?: string | null;
    lead: { fullName?: string | null; email?: string | null; company?: { name: string } | null };
  }>;
  activities: Array<{
    id: string;
    action: string;
    simulated: boolean;
    createdAt: string;
    lead?: { fullName?: string | null; firstName?: string | null } | null;
  }>;
};

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<CampaignDetail | null>(null);
  const [tab, setTab] = useState("Overview");
  const [busy, setBusy] = useState(false);
  const [launchOpen, setLaunchOpen] = useState(false);
  const [sendMode, setSendMode] = useState<"now" | "scheduled">("now");
  const [sendAt, setSendAt] = useState("");

  async function load() {
    const next = await api<CampaignDetail>(`/api/campaigns/${params.id}`);
    setData(next);
  }

  useEffect(() => {
    load().catch(() => undefined);
    const timer = setInterval(() => {
      load().catch(() => undefined);
      api("/api/tick", { method: "POST" }).catch(() => undefined);
    }, 4000);
    return () => clearInterval(timer);
  }, [params.id]);

  if (!data) {
    return (
      <AppShell title="Campaign">
        <p className="text-sm text-muted">Loading campaign...</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={data.name}
      subtitle={titleCase(data.goal)}
      actions={
        <div className="flex items-center gap-2">
          <Badge tone="info">Simulation</Badge>
          <Badge tone={statusTone(data.status)}>{titleCase(data.status)}</Badge>
          {data.status === "running" ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await api(`/api/campaigns/${data.id}/pause`, { method: "POST", body: JSON.stringify({ action: "pause" }) });
                await load();
                setBusy(false);
              }}
            >
              Pause
            </Button>
          ) : null}
          {data.status === "scheduled" ? <Badge tone="info">Scheduled</Badge> : null}
          {data.status === "paused" || data.status === "draft" ? (
            <Button
              size="sm"
              disabled={busy}
              onClick={async () => {
                if (data.status === "draft") {
                  setLaunchOpen(true);
                  return;
                }
                setBusy(true);
                await api(`/api/campaigns/${data.id}/pause`, { method: "POST", body: JSON.stringify({ action: "resume" }) });
                await load();
                setBusy(false);
              }}
            >
              {data.status === "draft" ? "Launch" : "Resume"}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="grid grid-cols-5 gap-3">
        <Metric label="Leads" value={formatNumber(data.campaignLeads.length)} />
        <Metric label="Actions" value={formatNumber(data.metrics.messagesSent)} />
        <Metric label="Opened" value={formatPercent(data.metrics.openRate)} />
        <Metric label="Replied" value={formatPercent(data.metrics.replyRate)} />
        <Metric label="Meetings" value={formatNumber(data.metrics.meetings)} />
      </div>

      <div className="mt-6 flex gap-4 border-b border-line">
        {["Overview", "Sequence", "Workflow", "Leads", "Activity", "Analytics"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`border-b-2 px-1 pb-2 text-sm ${tab === item ? "border-ink text-ink" : "border-transparent text-muted"}`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "Overview" && (
          <p className="max-w-2xl text-sm leading-6 text-muted">
            This campaign is running independently of the browser. Execution state is stored on each enrolled lead.
            Simulated actions are labeled and never presented as real outreach.
            {data.sendAt && data.status === "scheduled"
              ? ` First send is scheduled for ${new Date(data.sendAt).toLocaleString()}.`
              : ""}
          </p>
        )}

        {tab === "Sequence" && <SequenceDesk campaignId={data.id} />}

        {tab === "Workflow" && (
          <WorkflowCanvas
            value={data.workflow}
            onChange={async (graph) => {
              await api(`/api/campaigns/${data.id}`, {
                method: "PATCH",
                body: JSON.stringify({ workflow: graph }),
              });
              await load();
            }}
            goal={data.goal}
          />
        )}

        {tab === "Leads" && (
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-paper text-[11px] uppercase tracking-[0.12em] text-faint">
                <tr>
                  <th className="px-4 py-2">Contact</th>
                  <th className="px-4 py-2">Company</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Current step</th>
                </tr>
              </thead>
              <tbody>
                {data.campaignLeads.map((item) => (
                  <tr key={item.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-2">{item.lead.fullName || item.lead.email}</td>
                    <td className="px-4 py-2 text-muted">{item.lead.company?.name || "—"}</td>
                    <td className="px-4 py-2"><Badge tone={statusTone(item.status)}>{titleCase(item.status)}</Badge></td>
                    <td className="px-4 py-2 text-muted">{item.currentNodeId || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Activity" && (
          <div className="divide-y divide-line rounded-lg border border-line bg-surface">
            {data.activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm">{titleCase(activity.action)}</div>
                  <div className="text-xs text-muted">
                    {activity.lead?.fullName || activity.lead?.firstName || "Campaign"}
                    {activity.simulated ? " · Simulated" : ""}
                  </div>
                </div>
                <div className="font-mono text-[11px] text-faint">{formatRelative(activity.createdAt)}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "Analytics" && (
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Contacted" value={formatNumber(data.metrics.leadsContacted)} />
            <Metric label="Reply rate" value={formatPercent(data.metrics.replyRate)} />
            <Metric label="Meetings" value={formatNumber(data.metrics.meetings)} />
          </div>
        )}
      </div>

      {launchOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-[14px] border border-line bg-white p-5">
            <div className="text-[16px] font-semibold">Launch campaign</div>
            <p className="mt-2 text-[13px] text-muted">
              Sends still go through simulated providers unless real credentials exist.
            </p>
            <div className="mt-4 space-y-2 text-[13px]">
              <label className="flex items-center gap-2">
                <input type="radio" checked={sendMode === "now"} onChange={() => setSendMode("now")} />
                Send now
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={sendMode === "scheduled"} onChange={() => setSendMode("scheduled")} />
                Schedule
              </label>
              {sendMode === "scheduled" ? (
                <input
                  type="datetime-local"
                  value={sendAt}
                  onChange={(event) => setSendAt(event.target.value)}
                  className="w-full rounded-[8px] border border-line px-2 py-1.5"
                />
              ) : null}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => setLaunchOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={busy || (sendMode === "scheduled" && !sendAt)}
                onClick={async () => {
                  setBusy(true);
                  await api(`/api/campaigns/${data.id}/launch`, {
                    method: "POST",
                    body: JSON.stringify({
                      sendMode,
                      sendAt: sendMode === "scheduled" ? new Date(sendAt).toISOString() : undefined,
                    }),
                  });
                  setLaunchOpen(false);
                  await load();
                  setBusy(false);
                }}
              >
                {busy ? "Starting…" : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
