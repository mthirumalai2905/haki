"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Metric } from "@/components/ui/Metric";
import { api } from "@/lib/api";
import { formatNumber, formatPercent } from "@/lib/utils";

type Analytics = {
  metrics: {
    leadsContacted: number;
    messagesSent: number;
    openRate: number;
    replyRate: number;
    positiveReplyRate: number;
    meetings: number;
    conversionRate: number;
  };
  groups: Array<{ key: string; label: string; metrics: { messagesSent: number; replies: number; meetings: number; replyRate: number } }>;
};

export default function AnalyticsPage() {
  const [group, setGroup] = useState("channel");
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    api<Analytics>(`/api/analytics?group=${group}`).then(setData);
  }, [group]);

  return (
    <AppShell title="Analytics" subtitle="Simple, actionable numbers derived from activity.">
      <div className="grid grid-cols-4 gap-3">
        <Metric label="Delivery" value={formatNumber(data?.metrics.messagesSent ?? 0)} />
        <Metric label="Open rate" value={formatPercent(data?.metrics.openRate ?? 0)} />
        <Metric label="Reply rate" value={formatPercent(data?.metrics.replyRate ?? 0)} />
        <Metric label="Positive replies" value={formatPercent(data?.metrics.positiveReplyRate ?? 0)} />
        <Metric label="Meetings" value={formatNumber(data?.metrics.meetings ?? 0)} />
        <Metric label="Conversion" value={formatPercent(data?.metrics.conversionRate ?? 0)} />
        <Metric label="Contacted" value={formatNumber(data?.metrics.leadsContacted ?? 0)} />
      </div>

      <div className="mt-8 flex gap-2">
        {["channel", "campaign", "industry", "workflow_step"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setGroup(item)}
            className={`rounded-md px-3 py-1.5 text-xs ${group === item ? "bg-ink text-paper" : "bg-surface text-muted"}`}
          >
            {item.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper text-[11px] uppercase tracking-[0.12em] text-faint">
            <tr>
              <th className="px-4 py-2">Breakdown</th>
              <th className="px-4 py-2">Sent</th>
              <th className="px-4 py-2">Replies</th>
              <th className="px-4 py-2">Reply rate</th>
              <th className="px-4 py-2">Meetings</th>
            </tr>
          </thead>
          <tbody>
            {(data?.groups ?? []).map((row) => (
              <tr key={row.key} className="border-b border-line last:border-0">
                <td className="px-4 py-2">{row.label}</td>
                <td className="px-4 py-2">{row.metrics.messagesSent}</td>
                <td className="px-4 py-2">{row.metrics.replies}</td>
                <td className="px-4 py-2">{formatPercent(row.metrics.replyRate)}</td>
                <td className="px-4 py-2">{row.metrics.meetings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
