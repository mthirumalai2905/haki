"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SocialDetailList, SocialIconRow } from "@/components/ui/SocialIcons";
import { formatRelative, titleCase } from "@/lib/utils";

export type LeadPreview = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  whatsapp?: string | null;
  reddit?: string | null;
  x?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  googleWorkspace?: string | null;
  website?: string | null;
  industry?: string | null;
  country?: string | null;
  companySize?: string | null;
  status?: string;
  source?: string | null;
  company?: { name: string; industry?: string | null; companySize?: string | null; city?: string | null } | null;
};

type LeadDetail = LeadPreview & {
  status: string;
  customFields: Record<string, string>;
  qualifications: Array<{ score: number; status: string; reason: string }>;
  campaignLeads: Array<{ campaign: { id: string; name: string; status: string } }>;
  activities: Array<{ id: string; action: string; simulated: boolean; createdAt: string }>;
};

type Insight = {
  aiSummary?: string;
  nextAction?: { action: string; reason: string };
};

export function LeadDrawer({
  leadId,
  preview,
  onClose,
}: {
  leadId: string | null;
  preview?: LeadPreview | null;
  onClose: () => void;
}) {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [qualifying, setQualifying] = useState(false);

  useEffect(() => {
    if (!leadId) {
      setLead(null);
      setInsight(null);
      return;
    }
    setLead(null);
    setInsight(null);
    api<LeadDetail>(`/api/leads/${leadId}`).then(setLead).catch(() => undefined);
    api<Insight>(`/api/leads/${leadId}/insight`).then(setInsight).catch(() => undefined);
  }, [leadId]);

  useEffect(() => {
    if (!leadId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [leadId, onClose]);

  const view = lead ?? preview ?? null;
  const name = view
    ? view.fullName || [view.firstName, view.lastName].filter(Boolean).join(" ") || "Untitled"
    : "";
  const qualification = lead?.qualifications?.[0];
  const socials = {
    whatsapp: view?.whatsapp,
    linkedin: view?.linkedin,
    instagram: view?.instagram,
    x: view?.x,
    youtube: view?.youtube,
    reddit: view?.reddit,
    tiktok: view?.tiktok,
    googleWorkspace: view?.googleWorkspace,
  };

  return (
    <AnimatePresence>
      {leadId ? (
        <>
          <motion.button
            type="button"
            aria-label="Close lead preview"
            className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: 36, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 28, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mac-window fixed inset-y-3 right-3 z-50 flex w-[360px] flex-col overflow-hidden rounded-[12px] bg-white"
          >
            <div className="flex items-start justify-between border-b border-line px-4 py-3.5">
              <div className="min-w-0 pr-3">
                <div className="truncate text-[15px] font-medium tracking-[-0.01em]">
                  {view?.company?.name || name || "Lead"}
                </div>
                <div className="truncate text-[12px] text-muted">
                  {name || "—"}
                  {view?.jobTitle ? ` · ${view.jobTitle}` : ""}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {view?.status ? (
                    <Badge tone={statusTone(view.status)}>{titleCase(view.status)}</Badge>
                  ) : null}
                  <SocialIconRow links={socials} showMissing={false} />
                </div>
              </div>
              <button type="button" onClick={onClose} className="text-faint hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-auto px-4 py-4">
              {!view ? (
                <p className="text-sm text-muted">Loading lead…</p>
              ) : (
                <>
                  <section>
                    <Label>Contact</Label>
                    <Row k="First name" v={view.firstName} />
                    <Row k="Last name" v={view.lastName} />
                    <Row k="Title" v={view.jobTitle} />
                    <Row k="Onsite email" v={view.email} href={view.email ? `mailto:${view.email}` : undefined} />
                    <Row k="Phone" v={view.phone} />
                    <Row k="WhatsApp" v={view.whatsapp} />
                  </section>

                  <section>
                    <Label>Business</Label>
                    <Row k="Business name" v={view.company?.name} />
                    <Row k="Website" v={view.website} href={view.website} />
                    <Row k="Industry" v={view.industry || view.company?.industry} />
                    <Row k="Size" v={view.companySize || view.company?.companySize} />
                    <Row k="Country" v={view.country} />
                    <Row k="City" v={view.company?.city} />
                    <Row k="Source" v={view.source === "sample" ? "Dummy / sample" : view.source} />
                  </section>

                  <section>
                    <Label>Channels</Label>
                    <SocialDetailList links={socials} />
                  </section>

                  <section>
                    <div className="mb-2 flex items-center justify-between">
                      <Label>Qualification</Label>
                      {lead ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={qualifying}
                          onClick={async () => {
                            setQualifying(true);
                            await api("/api/leads/qualify", {
                              method: "POST",
                              body: JSON.stringify({ leadIds: [lead.id] }),
                            });
                            const next = await api<LeadDetail>(`/api/leads/${lead.id}`);
                            setLead(next);
                            setQualifying(false);
                          }}
                        >
                          {qualifying ? "Scoring…" : "Qualify"}
                        </Button>
                      ) : null}
                    </div>
                    {qualification ? (
                      <div className="rounded-[10px] border border-line p-3">
                        <div className="flex items-center justify-between">
                          <div className="font-mono text-2xl tracking-[-0.03em]">{qualification.score}</div>
                          <Badge tone={statusTone(qualification.status)}>{titleCase(qualification.status)}</Badge>
                        </div>
                        <p className="mt-2 text-[13px] leading-5 text-muted">{qualification.reason}</p>
                      </div>
                    ) : (
                      <p className="text-[13px] text-muted">Not qualified yet.</p>
                    )}
                  </section>

                  <section>
                    <Label>AI summary</Label>
                    <p className="text-[13px] leading-5 text-muted">
                      {insight?.aiSummary || "Reading this lead…"}
                    </p>
                  </section>

                  <section>
                    <Label>Next action</Label>
                    <p className="text-[13px] text-ink">{titleCase(insight?.nextAction?.action || "review")}</p>
                    <p className="text-[13px] text-muted">{insight?.nextAction?.reason}</p>
                  </section>

                  <section>
                    <Label>Campaigns</Label>
                    {!lead ? (
                      <p className="text-[13px] text-muted">Loading…</p>
                    ) : lead.campaignLeads.length === 0 ? (
                      <p className="text-[13px] text-muted">Not enrolled yet.</p>
                    ) : (
                      lead.campaignLeads.map((item) => (
                        <div key={item.campaign.id} className="flex items-center justify-between py-1 text-[13px]">
                          <span className="truncate pr-2">{item.campaign.name}</span>
                          <Badge tone={statusTone(item.campaign.status)}>{titleCase(item.campaign.status)}</Badge>
                        </div>
                      ))
                    )}
                  </section>

                  <section>
                    <Label>Activity</Label>
                    {!lead ? (
                      <p className="text-[13px] text-muted">Loading…</p>
                    ) : lead.activities.length === 0 ? (
                      <p className="text-[13px] text-muted">No events yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {lead.activities.map((activity, index) => (
                          <div key={activity.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="mt-1 h-2 w-2 rounded-full bg-ink" />
                              {index < lead.activities.length - 1 ? <div className="h-full w-px bg-line" /> : null}
                            </div>
                            <div>
                              <div className="text-[13px]">{titleCase(activity.action)}</div>
                              <div className="text-[11px] text-faint">
                                {formatRelative(activity.createdAt)}
                                {activity.simulated ? " · Simulated" : ""}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {lead && Object.keys(lead.customFields || {}).length > 0 ? (
                    <section>
                      <Label>Custom fields</Label>
                      {Object.entries(lead.customFields).map(([key, value]) => (
                        <Row key={key} k={key} v={value} />
                      ))}
                    </section>
                  ) : null}
                </>
              )}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-faint">{children}</div>;
}

function Row({ k, v, href }: { k: string; v?: string | null; href?: string | null }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-[13px]">
      <span className="text-muted">{k}</span>
      {href && v ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="max-w-[200px] truncate text-right text-ink underline decoration-line hover:decoration-ink"
        >
          {v}
        </a>
      ) : (
        <span className="max-w-[200px] truncate text-right text-ink">{v || "—"}</span>
      )}
    </div>
  );
}
