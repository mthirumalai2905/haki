"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Phase = "idle" | "planning" | "collecting" | "done";

export function CollectionPreview({
  rows,
  columns,
  found,
  target,
  pct,
  phase,
  status,
  sending,
  tableRef,
  onDownload,
  onImport,
}: {
  rows: Array<Record<string, string>>;
  columns: string[];
  found: number;
  target: number;
  pct: number;
  phase: Phase;
  status: string;
  sending: boolean;
  tableRef: React.RefObject<HTMLDivElement | null>;
  onDownload: () => void;
  onImport: () => void;
}) {
  const [query, setQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const ready = phase === "done" && rows.length > 0;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const listed = rows.map((row, index) => ({ row, index }));
    if (!q) return listed;
    return listed.filter(({ row }) => Object.values(row).some((value) => value.toLowerCase().includes(q)));
  }, [query, rows]);
  const selected = openIndex != null ? rows[openIndex] : null;

  return (
    <aside className="flex min-h-0 min-w-0 flex-1 bg-white">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <div className="text-[13px] font-semibold">Collection</div>
            <p className="text-[12px] text-muted">
              {found} of {target || 0} · {pct}%
              {phase === "collecting" ? " · live" : phase === "done" ? " · complete" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {ready ? (
              <>
                <Button size="sm" variant="secondary" onClick={onDownload}>
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </Button>
                <Button size="sm" onClick={onImport} disabled={sending}>
                  {sending ? "Sending…" : "Import"}
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <div className="h-0.5 bg-[#ececf0]">
          <div
            className={`h-full ${phase === "done" ? "bg-good" : "bg-accent"}`}
            style={{ width: `${Math.max(phase === "idle" ? 0 : 3, pct)}%` }}
          />
        </div>

        {rows.length ? (
          <div className="flex items-center gap-2 border-b border-line px-4 py-2">
            <Search className="h-3.5 w-3.5 text-faint" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-faint"
            />
            <span className="shrink-0 text-[11px] text-faint">{filtered.length}</span>
          </div>
        ) : null}

        <div ref={tableRef} className="min-h-0 flex-1 overflow-auto">
          {rows.length && columns.length ? (
            <table className="w-full text-left text-[13px]">
              <thead className="sticky top-0 bg-[#fafafa] text-[11px] text-faint">
                <tr className="border-b border-line">
                  <th className="w-10 px-4 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Company</th>
                  <th className="px-3 py-2 font-medium">Contact</th>
                  <th className="hidden px-3 py-2 font-medium md:table-cell">Place</th>
                  <th className="hidden px-3 py-2 font-medium lg:table-cell">Site</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ row, index }) => {
                  const view = summarize(row);
                  const active = openIndex === index;
                  return (
                    <tr
                      key={`${index}-${view.company}`}
                      onClick={() => setOpenIndex(index)}
                      className={`cursor-pointer border-b border-line last:border-0 ${
                        active ? "bg-accent-soft" : "hover:bg-[#f7f7f8]"
                      }`}
                    >
                      <td className="px-4 py-2.5 font-mono text-[11px] text-faint">
                        {String(index + 1).padStart(2, "0")}
                      </td>
                      <td className="max-w-[160px] truncate px-3 py-2.5 font-medium">{view.company}</td>
                      <td className="max-w-[180px] truncate px-3 py-2.5 text-muted">
                        {view.person || "blank"}
                        {view.title ? ` · ${view.title}` : ""}
                      </td>
                      <td className="hidden max-w-[140px] truncate px-3 py-2.5 text-muted md:table-cell">
                        {view.place || "blank"}
                      </td>
                      <td className="hidden max-w-[140px] truncate px-3 py-2.5 text-muted lg:table-cell">
                        {view.site || "blank"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <EmptyBoard phase={phase} status={status} />
          )}
        </div>
      </div>

      {selected && openIndex != null ? (
        <HitDetail
          row={selected}
          index={openIndex}
          columns={columns}
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </aside>
  );
}

function HitDetail({
  row,
  index,
  columns,
  onClose,
}: {
  row: Record<string, string>;
  index: number;
  columns: string[];
  onClose: () => void;
}) {
  const router = useRouter();
  const view = summarize(row);

  function openHaki() {
    const seed = [
      `Work from this collected record.`,
      `Company: ${view.company}.`,
      view.person ? `Contact: ${view.person}${view.title ? `, ${view.title}` : ""}.` : "",
      view.place ? `Place: ${view.place}.` : "",
      view.site ? `Website: ${view.site}.` : "",
      view.email ? `Email: ${view.email}.` : "Email is missing. Do not invent one.",
      `Draft a review-first multi-touch campaign for this company. Do not launch.`,
    ]
      .filter(Boolean)
      .join(" ");
    sessionStorage.setItem("haki:seed", seed);
    router.push("/haki");
  }

  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-l border-line bg-[#fafafa]">
      <div className="flex items-start justify-between gap-3 border-b border-line bg-white px-4 py-3">
        <div className="min-w-0">
          <div className="text-[11px] text-faint">Record {String(index + 1).padStart(2, "0")}</div>
          <div className="truncate text-[15px] font-semibold tracking-[-0.02em]">{view.company}</div>
          <div className="truncate text-[12px] text-muted">
            {view.person || "No contact"}
            {view.title ? ` · ${view.title}` : ""}
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-[6px] p-1 text-faint hover:bg-[#f2f2f7] hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
        <dl className="space-y-2.5">
          {columns.map((column) => {
            const value = row[column]?.trim();
            return (
              <div key={column} className="grid grid-cols-[88px_1fr] gap-2 text-[12px]">
                <dt className="text-faint">{label(column)}</dt>
                <dd className={value ? "break-words text-ink" : "text-faint"}>
                  {value || "blank. not invented."}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>

      <div className="space-y-2 border-t border-line bg-white px-4 py-3">
        <Button className="w-full" size="sm" onClick={openHaki}>
          Open in Haki AI
        </Button>
        {view.href ? (
          <a
            href={view.href}
            target="_blank"
            rel="noreferrer"
            className="block text-center text-[12px] text-accent hover:underline"
          >
            Open website
          </a>
        ) : null}
        <p className="text-[11px] leading-4 text-faint">
          Haki AI drafts the path. Nothing sends until you review.
        </p>
      </div>
    </aside>
  );
}

function EmptyBoard({ phase, status }: { phase: Phase; status: string }) {
  return (
    <div className="flex h-full items-center justify-center px-8 text-center">
      <div>
        <div className="text-[14px] font-medium">
          {phase === "planning" ? "Plan is locking" : phase === "collecting" ? "Waiting on the first row" : "No rows yet"}
        </div>
        <p className="mt-2 max-w-sm text-[13px] leading-6 text-muted">
          {status || "Run a brief. Hits land in this table. Click a row for the record."}
        </p>
      </div>
    </div>
  );
}

function summarize(row: Record<string, string>) {
  const company = pick(row, ["company", "organization", "name"]) || "Unnamed company";
  const first = pick(row, ["first_name", "firstname", "first"]);
  const last = pick(row, ["last_name", "lastname", "last"]);
  const person = [first, last].filter(Boolean).join(" ") || pick(row, ["contact", "full_name"]);
  const title = pick(row, ["title", "job_title", "role"]);
  const email = pick(row, ["email"]);
  const place = [pick(row, ["city"]), pick(row, ["state", "region"])].filter(Boolean).join(", ");
  const siteRaw = pick(row, ["website", "url"]);
  const site = siteRaw ? host(siteRaw) : "";
  const href = siteRaw ? (siteRaw.startsWith("http") ? siteRaw : `https://${siteRaw}`) : "";
  return { company, person, title, email, place, site, href };
}

function pick(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    if (row[key]?.trim()) return row[key].trim();
    const match = Object.keys(row).find((item) => item.toLowerCase().replace(/\s+/g, "_") === key);
    if (match && row[match]?.trim()) return row[match].trim();
  }
  return "";
}

function label(column: string) {
  return column.replace(/_/g, " ");
}

function host(value: string) {
  try {
    return new URL(value.startsWith("http") ? value : `https://${value}`).hostname.replace(/^www\./, "");
  } catch {
    return value.replace(/^https?:\/\//, "").replace(/^www\./, "");
  }
}
