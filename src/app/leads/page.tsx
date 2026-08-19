"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Badge, statusTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LeadDrawer } from "@/components/leads/LeadDrawer";
import { SocialIconRow } from "@/components/ui/SocialIcons";
import { api } from "@/lib/api";
import { titleCase } from "@/lib/utils";

type LeadRow = {
  id: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  x?: string | null;
  website?: string | null;
  instagram?: string | null;
  reddit?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  googleWorkspace?: string | null;
  whatsapp?: string | null;
  industry?: string | null;
  country?: string | null;
  companySize?: string | null;
  status: string;
  source?: string | null;
  company?: { name: string; industry?: string | null; companySize?: string | null; city?: string | null } | null;
};

export default function LeadsPage() {
  const [items, setItems] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    params.set("pageSize", "100");
    return params.toString();
  }, [search, status]);

  async function load() {
    const data = await api<{ items: LeadRow[]; total: number }>(`/api/leads?${query}`);
    setItems(data.items);
    setTotal(data.total);
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      load().catch(() => undefined);
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <AppShell
      title="Leads"
      subtitle="Independent fried businesses and the channels you can reach them on."
      actions={
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={selected.length === 0 || busy}
            onClick={async () => {
              setBusy(true);
              await api("/api/leads/qualify", { method: "POST", body: JSON.stringify({ leadIds: selected }) });
              await load();
              setBusy(false);
            }}
          >
            Qualify selected
          </Button>
          <Link href="/leads/import"><Button size="sm">Import leads</Button></Link>
        </div>
      }
    >
      <div className="mb-4 flex items-center gap-2">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search shops, emails, cities"
          className="h-9 w-80 rounded-md border border-line bg-surface px-3 text-sm outline-none"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-9 rounded-md border border-line bg-surface px-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="qualified">Qualified</option>
          <option value="maybe">Maybe</option>
          <option value="unqualified">Unqualified</option>
        </select>
        <div className="ml-auto text-right">
          <div className="text-xs text-muted">{total} businesses</div>
          <div className="text-[11px] text-faint">
            Preview of 100 sample rows
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No fried businesses in this workspace"
          body="Upload a CSV or XLSX with business name, website, onsite email, phone, and social links."
          action="Import leads"
          onAction={() => (window.location.href = "/leads/import")}
        />
      ) : (
        <div className="overflow-hidden rounded-[14px] border border-line bg-white">
          <div className="flex items-start justify-between gap-4 border-b border-line bg-paper px-4 py-2.5">
            <p className="text-[12px] leading-5 text-muted">
              Preview of 100 sample rows from the ingested file.
              {items.every((item) => item.source === "sample")
                ? " Dummy shops for now — imported CSV or XLSX will fill this table."
                : " Full ingest stays in the workspace; this view does not load thousands of rows."}
            </p>
          </div>
          <div className="scrollbar-thin overflow-x-auto">
            <table className="min-w-[1180px] w-full text-left text-sm">
              <thead className="border-b border-line bg-paper text-[11px] uppercase tracking-[0.12em] text-faint">
                <tr>
                  <th className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.length > 0 && selected.length === items.length}
                      onChange={(event) => setSelected(event.target.checked ? items.map((item) => item.id) : [])}
                    />
                  </th>
                  <th className="px-3 py-2 font-medium">ID</th>
                  <th className="px-3 py-2 font-medium">Business name</th>
                  <th className="px-3 py-2 font-medium">Website</th>
                  <th className="px-3 py-2 font-medium">Onsite email</th>
                  <th className="px-3 py-2 font-medium">Phone</th>
                  <th className="px-3 py-2 font-medium">Social</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((lead) => {
                  const business = lead.company?.name || "—";
                  const owner = lead.fullName || [lead.firstName, lead.lastName].filter(Boolean).join(" ");
                  return (
                    <tr
                      key={lead.id}
                      className="cursor-pointer border-b border-line last:border-0 hover:bg-paper"
                      onClick={() => setOpenId(lead.id)}
                    >
                      <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.includes(lead.id)}
                          onChange={(event) => {
                            setSelected((current) =>
                              event.target.checked ? [...current, lead.id] : current.filter((id) => id !== lead.id),
                            );
                          }}
                        />
                      </td>
                      <td className="px-3 py-3 font-mono text-[11px] text-faint">{lead.id.slice(0, 8)}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium">{business}</div>
                        <div className="text-xs text-muted">
                          {owner || "—"}
                          {lead.jobTitle ? ` · ${lead.jobTitle}` : ""}
                          {lead.industry ? ` · ${lead.industry}` : ""}
                        </div>
                      </td>
                      <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                        {lead.website ? (
                          <a href={lead.website} target="_blank" rel="noreferrer" className="text-ink underline decoration-line hover:decoration-ink">
                            {lead.website.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-muted">{lead.email || "—"}</td>
                      <td className="px-3 py-3 text-muted">{lead.phone || "—"}</td>
                      <td className="px-3 py-3">
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
                        />
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={statusTone(lead.status)}>{titleCase(lead.status)}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <LeadDrawer
        leadId={openId}
        preview={items.find((item) => item.id === openId) ?? null}
        onClose={() => setOpenId(null)}
      />
    </AppShell>
  );
}
