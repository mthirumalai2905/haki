"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, statusTone } from "@/components/ui/Badge";
import { SocialIconRow } from "@/components/ui/SocialIcons";
import { titleCase } from "@/lib/utils";
import { LeadDrawer, type LeadPreview } from "@/components/leads/LeadDrawer";
import { walkMainPath } from "@/lib/workflow/ops";
import type { HermesProposal } from "@/lib/hermes/types";

export type PreviewLead = LeadPreview & { status: string };

export function IngestPreview({
  leads,
  total,
  proposal,
  campaignId,
  tab,
  onTab,
}: {
  leads: PreviewLead[];
  total: number;
  proposal?: HermesProposal | null;
  campaignId?: string;
  tab: "leads" | "campaign";
  onTab: (tab: "leads" | "campaign") => void;
}) {
  const sample = leads.length > 0 && leads.every((item) => item.source === "sample");
  const [openId, setOpenId] = useState<string | null>(null);
  const selected = leads.find((item) => item.id === openId) ?? null;

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-[#f7f7f8]">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <div>
          <div className="text-[14px] font-semibold tracking-[-0.02em]">Preview</div>
          <p className="mt-0.5 text-[12px] text-muted">
            {total} rows · first 100 from the ingested file
          </p>
        </div>
        <Link href="/leads" className="text-[12px] text-accent hover:underline">
          Open table
        </Link>
      </div>

      <div className="mx-4 mt-3 flex rounded-[10px] bg-white p-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <TabButton active={tab === "leads"} onClick={() => onTab("leads")}>
          File
        </TabButton>
        <TabButton active={tab === "campaign"} onClick={() => onTab("campaign")}>
          Campaign
        </TabButton>
      </div>

      {sample ? (
        <p className="px-4 pt-2 text-[11px] text-faint">Dummy shops until a CSV or XLSX is imported.</p>
      ) : null}

      {tab === "campaign" ? (
        <CampaignPreview proposal={proposal} campaignId={campaignId} />
      ) : (
        <div className="m-4 min-h-0 flex-1 overflow-hidden rounded-[12px] border border-line bg-white">
          <div className="h-full overflow-x-hidden overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full table-fixed text-left text-[12px]">
              <thead className="sticky top-0 bg-white text-[10px] uppercase tracking-[0.12em] text-faint">
                <tr className="border-b border-line">
                  <th className="w-[28%] px-4 py-2.5 font-medium">Business</th>
                  <th className="w-[28%] px-4 py-2.5 font-medium">Email</th>
                  <th className="w-[14%] px-4 py-2.5 font-medium">Status</th>
                  <th className="w-[30%] px-4 py-2.5 font-medium">Reach</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const owner = lead.fullName || [lead.firstName, lead.lastName].filter(Boolean).join(" ");
                  return (
                    <tr
                      key={lead.id}
                      className="cursor-pointer border-b border-line last:border-0 hover:bg-[#fafafa]"
                      onClick={() => setOpenId(lead.id)}
                    >
                      <td className="px-4 py-2.5">
                        <div className="truncate font-medium text-ink">{lead.company?.name || "—"}</div>
                        <div className="truncate text-[11px] text-muted">{owner || "—"}</div>
                      </td>
                      <td className="truncate px-4 py-2.5 text-muted">{lead.email || "—"}</td>
                      <td className="px-4 py-2.5">
                        <Badge tone={statusTone(lead.status)}>{titleCase(lead.status)}</Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <SocialIconRow
                          links={{
                            whatsapp: lead.whatsapp,
                            linkedin: lead.linkedin,
                            instagram: lead.instagram,
                            x: lead.x,
                            youtube: lead.youtube,
                            reddit: lead.reddit,
                            tiktok: lead.tiktok,
                            googleWorkspace: lead.googleWorkspace,
                          }}
                          showMissing={false}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <LeadDrawer leadId={openId} preview={selected} onClose={() => setOpenId(null)} />
    </aside>
  );
}

function CampaignPreview({
  proposal,
  campaignId,
}: {
  proposal?: HermesProposal | null;
  campaignId?: string;
}) {
  if (!proposal?.workflow) {
    return (
      <div className="m-4 flex flex-1 items-center justify-center rounded-[12px] border border-dashed border-line bg-white px-8 text-center text-[13px] leading-6 text-muted">
        Ask Haki to draft a campaign. The steps will land here for review.
      </div>
    );
  }

  const steps = walkMainPath(proposal.workflow).filter((node) => node.data.type !== "trigger");
  const changed = new Set(proposal.changedNodeIds ?? []);
  const id = campaignId || proposal.campaignId;

  return (
    <div className="scrollbar-thin m-4 min-h-0 flex-1 space-y-3 overflow-auto">
      <div className="rounded-[12px] border border-line bg-white px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[15px] font-semibold tracking-[-0.02em]">{proposal.name}</div>
            <div className="mt-1 text-[12px] text-muted">
              {(proposal.channels || []).join(" · ") || "Multi-channel"} · {proposal.audience?.count ?? 0} businesses
            </div>
          </div>
          {id ? (
            <Link href={`/campaigns/${id}`} className="shrink-0 text-[12px] text-accent hover:underline">
              Open in Campaigns
            </Link>
          ) : null}
        </div>
        {id ? (
          <p className="mt-2 text-[11px] text-faint">Live with the Campaigns directory. Chat edits rewrite this sequence.</p>
        ) : null}
      </div>
      {proposal.changes?.length ? (
        <div className="rounded-[12px] border border-accent/20 bg-white px-4 py-3">
          <div className="text-[10px] uppercase tracking-[0.12em] text-faint">Just updated</div>
          <ul className="mt-1 space-y-0.5 text-[12px] text-ink">
            {proposal.changes.map((change) => (
              <li key={change}>· {change}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <ol className="space-y-2">
        {steps.map((node, index) => (
          <li
            key={node.id}
            className={`rounded-[12px] border bg-white px-3.5 py-3 ${
              changed.has(node.id) ? "border-accent" : "border-line"
            }`}
          >
            <div className="text-[10px] uppercase tracking-[0.12em] text-faint">
              Step {index + 1}
              {node.data.channel ? ` · ${node.data.channel}` : node.data.type === "wait" ? " · wait" : ""}
            </div>
            <div className="mt-1 text-[13px] font-medium">{node.data.label}</div>
            {node.data.description ? (
              <div className="mt-0.5 text-[12px] text-muted">{node.data.description}</div>
            ) : null}
            <div className="mt-1.5 flex flex-wrap gap-1">
              {node.data.waitHours ? (
                <span className="rounded-full bg-[#f2f2f7] px-2 py-0.5 text-[10px] text-muted">
                  {node.data.waitHours}h
                </span>
              ) : null}
              {node.data.weekdayOnly ? (
                <span className="rounded-full bg-[#f2f2f7] px-2 py-0.5 text-[10px] text-muted">Weekday only</span>
              ) : null}
              {changed.has(node.id) ? (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent">Updated</span>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-[8px] py-1.5 text-[12px] ${
        active ? "bg-[#f2f2f7] font-medium text-ink" : "text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
