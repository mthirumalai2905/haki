"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Badge, statusTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api";
import { titleCase } from "@/lib/utils";

type Campaign = {
  id: string;
  name: string;
  goal: string;
  status: string;
  channels: string[];
  leadCount: number;
};

export default function CampaignsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Campaign[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Campaign[]>("/api/campaigns").then(setItems).catch(() => setItems([]));
  }, []);

  async function setupDummy() {
    setBusy(true);
    try {
      const result = await api<{ campaignId: string }>("/api/campaigns/dummy", {
        method: "POST",
        body: JSON.stringify({ launch: true }),
      });
      router.push(`/campaigns/${result.campaignId}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title="Campaigns"
      subtitle="Create and manage multi-channel outreach."
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={setupDummy} disabled={busy}>
            {busy ? "Setting up…" : "Dummy multi-touch"}
          </Button>
          <Link href="/campaigns/new"><Button size="sm">Create campaign</Button></Link>
        </div>
      }
    >
      {items.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          body="Ask Hermes to draft a campaign, then drag the workflow into place."
          action="Set up dummy multi-touch"
          onAction={setupDummy}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper text-[11px] uppercase tracking-[0.12em] text-faint">
              <tr>
                {["Campaign", "Audience", "Channels", "Leads", "Status"].map((col) => (
                  <th key={col} className="px-4 py-2 font-medium">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((campaign) => (
                <tr key={campaign.id} className="border-b border-line last:border-0 hover:bg-paper">
                  <td className="px-4 py-3">
                    <Link href={`/campaigns/${campaign.id}`} className="font-medium hover:underline">
                      {campaign.name}
                    </Link>
                    <div className="text-xs text-muted">{titleCase(campaign.goal)}</div>
                  </td>
                  <td className="px-4 py-3 text-muted">Selected audience</td>
                  <td className="px-4 py-3 text-muted">{(campaign.channels || []).join(", ") || "—"}</td>
                  <td className="px-4 py-3">{campaign.leadCount}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(campaign.status)}>{titleCase(campaign.status)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
