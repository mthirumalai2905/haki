"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Metric } from "@/components/ui/Metric";
import { Badge, statusTone } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { formatNumber, formatPercent, formatRelative, greeting, titleCase } from "@/lib/utils";

type Overview = {
  totalLeads: number;
  activeCampaigns: number;
  messagesSent: number;
  replies: number;
  meetings: number;
  campaigns: Array<{ id: string; name: string; status: string; goal: string; leadCount: number }>;
  recent: Array<{
    id: string;
    action: string;
    simulated: boolean;
    createdAt: string;
    lead?: { fullName?: string | null; firstName?: string | null; company?: { name?: string | null } | null } | null;
  }>;
};

export default function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    api<Overview>("/api/overview").then(setData).catch(() => setData(null));
  }, []);

  return (
    <AppShell title="Overview" subtitle="What's happening across your outreach.">
      <div className="mb-8">
        <div className="text-[40px] font-semibold tracking-[-0.04em] text-ink">{greeting()}</div>
        <p className="mt-2 max-w-xl text-[15px] leading-6 text-muted">
          Haki turns a dataset into a multi-channel outreach system. Import leads, define who you want, and let the workflow run.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <Metric label="Active campaigns" value={formatNumber(data?.activeCampaigns ?? 0)} />
        <Metric label="Total leads" value={formatNumber(data?.totalLeads ?? 0)} />
        <Metric label="Messages sent" value={formatNumber(data?.messagesSent ?? 0)} />
        <Metric label="Replies" value={formatNumber(data?.replies ?? 0)} />
        <Metric label="Meetings" value={formatNumber(data?.meetings ?? 0)} />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-6">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">Active campaigns</h2>
            <Link href="/campaigns/new" className="text-xs text-muted hover:text-ink">
              Create
            </Link>
          </div>
          {!data?.campaigns.length ? (
            <EmptyState
              title="No campaigns yet"
              body="Build your first multi-channel outreach workflow."
              action="Create campaign"
              onAction={() => (window.location.href = "/campaigns/new")}
            />
          ) : (
            <div className="divide-y divide-line rounded-lg border border-line bg-surface">
              {data.campaigns.map((campaign) => (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-paper">
                  <div>
                    <div className="text-sm">{campaign.name}</div>
                    <div className="text-xs text-muted">{campaign.leadCount} leads · {titleCase(campaign.goal)}</div>
                  </div>
                  <Badge tone={statusTone(campaign.status)}>{titleCase(campaign.status)}</Badge>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">Recent activity</h2>
            <Badge tone="info">Simulation visible</Badge>
          </div>
          {!data?.recent.length ? (
            <EmptyState
              title="Nothing has happened yet"
              body="Import leads or launch a campaign to start the timeline."
            />
          ) : (
            <div className="divide-y divide-line rounded-lg border border-line bg-surface">
              {data.recent.map((item) => (
                <div key={item.id} className="flex items-start justify-between px-4 py-3">
                  <div>
                    <div className="text-sm">{titleCase(item.action)}</div>
                    <div className="text-xs text-muted">
                      {item.lead?.fullName || item.lead?.firstName || item.lead?.company?.name || "Workspace"}
                      {item.simulated ? " · Simulated" : ""}
                    </div>
                  </div>
                  <div className="font-mono text-[11px] text-faint">{formatRelative(item.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium">Performance</h2>
        <div className="rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">
          Reply rate {formatPercent(((data?.replies ?? 0) / Math.max(data?.messagesSent ?? 1, 1)) * 100)} across all simulated outreach.
          Keep this page quiet — the system is the product, not the dashboard.
        </div>
        <div className="mt-4 flex gap-2">
          <Link href="/haki"><Button>Open Haki AI</Button></Link>
          <Link href="/leads/import"><Button variant="secondary">Import leads</Button></Link>
          <Link href="/campaigns/new"><Button variant="secondary">Create campaign</Button></Link>
        </div>
      </section>
    </AppShell>
  );
}
