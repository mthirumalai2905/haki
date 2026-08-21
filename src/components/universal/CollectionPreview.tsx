"use client";

import { useMemo, useState } from "react";
import { Download, Globe, Mail, MapPin, Search, Users } from "lucide-react";
import { motion } from "motion/react";
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
  const ready = phase === "done" && rows.length > 0;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows.map((row, index) => ({ row, index }));
    return rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => Object.values(row).some((value) => value.toLowerCase().includes(q)));
  }, [query, rows]);

  return (
    <aside className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#f3f3f5]">
      <div className="border-b border-line bg-white px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[15px] font-semibold tracking-[-0.02em]">Live collection</div>
            <p className="mt-0.5 text-[12px] text-muted">
              Rows land here as they resolve. Empty fields stay empty.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PhasePill phase={phase} />
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

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="Found" value={String(found)} hint={phase === "collecting" ? "Coming in" : undefined} />
          <Stat label="Target" value={target ? String(target) : "0"} />
          <Stat label="Of the pass" value={`${pct}%`} accent />
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#ececf0]">
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${
              phase === "done" ? "bg-good" : "bg-accent"
            }`}
            style={{ width: `${Math.max(phase === "idle" ? 0 : 4, pct)}%` }}
          />
        </div>
      </div>

      {rows.length ? (
        <div className="flex items-center gap-2 px-5 py-3">
          <div className="flex flex-1 items-center gap-2 rounded-[12px] border border-line bg-white px-3 py-2">
            <Search className="h-3.5 w-3.5 text-faint" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter this pass"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-faint"
            />
          </div>
          <span className="text-[12px] text-muted">{filtered.length} showing</span>
        </div>
      ) : null}

      <div ref={tableRef} className="min-h-0 flex-1 overflow-auto px-5 pb-5">
        {rows.length && columns.length ? (
          <div className="space-y-2.5">
            {filtered.map(({ row, index }) => (
              <HitCard key={`${index}-${row.company ?? row.email ?? index}`} row={row} index={index} />
            ))}
          </div>
        ) : (
          <EmptyBoard phase={phase} status={status} />
        )}
      </div>
    </aside>
  );
}

function HitCard({ row, index }: { row: Record<string, string>; index: number }) {
  const company = pick(row, ["company", "organization", "name"]) || "Unnamed company";
  const first = pick(row, ["first_name", "firstname", "first"]);
  const last = pick(row, ["last_name", "lastname", "last"]);
  const person = [first, last].filter(Boolean).join(" ") || pick(row, ["contact", "full_name"]);
  const title = pick(row, ["title", "job_title", "role"]);
  const email = pick(row, ["email"]);
  const city = pick(row, ["city"]);
  const state = pick(row, ["state", "region"]);
  const place = [city, state].filter(Boolean).join(", ");
  const size = pick(row, ["company_size", "size", "employees"]);
  const website = pick(row, ["website", "url"]);
  const tone = colorFor(company);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="rounded-[16px] border border-line bg-white p-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.03)] hover:border-line-strong"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[12px] font-semibold text-white"
          style={{ background: tone }}
        >
          {initials(company)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold tracking-[-0.02em]">{company}</div>
              <div className="mt-0.5 truncate text-[12px] text-muted">
                {person || "No contact name"}
                {title ? ` · ${title}` : ""}
              </div>
            </div>
            <span className="shrink-0 font-mono text-[11px] text-faint">{String(index + 1).padStart(2, "0")}</span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Chip ok={Boolean(email)} icon={<Mail className="h-3 w-3" />}>
              {email || "No email"}
            </Chip>
            <Chip ok={Boolean(place)} icon={<MapPin className="h-3 w-3" />}>
              {place || "No place"}
            </Chip>
            <Chip ok={Boolean(size)} icon={<Users className="h-3 w-3" />}>
              {size || "No size"}
            </Chip>
            <Chip ok={Boolean(website)} icon={<Globe className="h-3 w-3" />}>
              {website ? host(website) : "No site"}
            </Chip>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function Chip({
  children,
  ok,
  icon,
}: {
  children: React.ReactNode;
  ok: boolean;
  icon: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 truncate rounded-full px-2 py-0.5 text-[11px] ${
        ok ? "bg-[#f2f2f7] text-ink" : "bg-[#f6f6f8] text-faint"
      }`}
    >
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}

function Stat({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className="rounded-[12px] border border-line bg-[#f8f8fa] px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.12em] text-faint">{label}</div>
      <div className={`mt-0.5 text-[18px] font-semibold tracking-[-0.03em] ${accent ? "text-accent" : "text-ink"}`}>
        {value}
      </div>
      {hint ? <div className="text-[10px] text-good">{hint}</div> : null}
    </div>
  );
}

function PhasePill({ phase }: { phase: Phase }) {
  const label =
    phase === "collecting" ? "Collecting" : phase === "planning" ? "Planning" : phase === "done" ? "Complete" : "Waiting";
  const color =
    phase === "collecting"
      ? "bg-good-soft text-good"
      : phase === "done"
        ? "bg-accent-soft text-accent"
        : "bg-[#f2f2f7] text-muted";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${color}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          phase === "collecting" ? "animate-pulse bg-good" : phase === "done" ? "bg-accent" : "bg-[#c7c7cc]"
        }`}
      />
      {label}
    </span>
  );
}

function EmptyBoard({ phase, status }: { phase: Phase; status: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-[18px] border border-dashed border-line bg-white px-8 text-center">
      <div className="flex gap-1.5">
        <span className="h-2 w-2 rounded-full bg-accent/70 animate-pulse" />
        <span className="h-2 w-2 rounded-full bg-[#34c759]/70 animate-pulse [animation-delay:120ms]" />
        <span className="h-2 w-2 rounded-full bg-[#ff9f0a]/70 animate-pulse [animation-delay:240ms]" />
      </div>
      <div className="mt-4 text-[15px] font-medium">
        {phase === "planning" ? "Locking the pass" : phase === "collecting" ? "Waiting on the first hit" : "Collection stays empty until a brief runs"}
      </div>
      <p className="mt-2 max-w-sm text-[13px] leading-6 text-muted">
        {status ||
          (phase === "planning"
            ? "The plan is settling. Cards will stack here as each record resolves."
            : "Describe who to collect. Hits appear as cards, not a dump of empty cells.")}
      </p>
    </div>
  );
}

function pick(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    if (row[key]?.trim()) return row[key].trim();
    const match = Object.keys(row).find((item) => item.toLowerCase().replace(/\s+/g, "_") === key);
    if (match && row[match]?.trim()) return row[match].trim();
  }
  return "";
}

function initials(value: string) {
  const parts = value.replace(/https?:\/\//, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "H") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function colorFor(value: string) {
  const palette = ["#007aff", "#34c759", "#af52de", "#ff9f0a", "#ff375f", "#32ade6", "#5856d6"];
  let hash = 0;
  for (const char of value) hash = (hash + char.charCodeAt(0)) % palette.length;
  return palette[hash];
}

function host(value: string) {
  try {
    return new URL(value.startsWith("http") ? value : `https://${value}`).hostname.replace(/^www\./, "");
  } catch {
    return value.replace(/^https?:\/\//, "").replace(/^www\./, "");
  }
}
