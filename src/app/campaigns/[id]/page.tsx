"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Metric } from "@/components/ui/Metric";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import { api } from "@/lib/api";
import { formatNumber, formatPercent, formatRelative, titleCase } from "@/lib/utils";
import type { WorkflowGraph } from "@/lib/types";

type CampaignDetail = {
  id: string;
  name: string;
  goal: string;
  status: string;
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
          {data.status === "paused" || data.status === "draft" ? (
            <Button
              size="sm"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                if (data.status === "draft") {
                  await api(`/api/campaigns/${data.id}/launch`, { method: "POST" });
                } else {
                  await api(`/api/campaigns/${data.id}/pause`, { method: "POST", body: JSON.stringify({ action: "resume" }) });
                }
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
        {["Overview", "Workflow", "Leads", "Activity", "Analytics"].map((item) => (
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
          </p>
        )}

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
    </AppShell>
  );
}
