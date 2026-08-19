"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { UniversalPlan, UniversalStreamEvent } from "@/lib/universal/types";

const HINTS = [
  "Get 100 founders details for mid sized startups from United States of America",
  "Series A SaaS founders in the US — name, email, company, title",
  "Mid-market startup CEOs in California with LinkedIn and email",
];

type Phase = "idle" | "planning" | "collecting" | "done";

export function UniversalHome() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [brief, setBrief] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<UniversalPlan | null>(null);
  const [thoughts, setThoughts] = useState<string[]>([]);
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [found, setFound] = useState(0);
  const [target, setTarget] = useState(0);
  const [filename, setFilename] = useState("haki-universal.csv");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [planPct, setPlanPct] = useState(42);
  const tableRef = useRef<HTMLDivElement>(null);
  const splitRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const busy = phase === "planning" || phase === "collecting";
  const columns = plan?.columns ?? [];

  useEffect(() => {
    const node = tableRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [rows.length]);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      if (!dragging.current || !splitRef.current) return;
      const rect = splitRef.current.getBoundingClientRect();
      const next = ((event.clientX - rect.left) / rect.width) * 100;
      setPlanPct(Math.min(72, Math.max(28, next)));
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  async function run(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setInput("");
    setBrief(message);
    setError("");
    setPlan(null);
    setThoughts([]);
    setRows([]);
    setFound(0);
    setTarget(0);
    setStatus("");
    setPhase("planning");

    try {
      const response = await fetch("/api/universal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        signal: abort.signal,
      });

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error?.message || "Haki Universal could not start that pass.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          applyEvent(JSON.parse(line) as UniversalStreamEvent);
        }
      }
    } catch (item) {
      if (abort.signal.aborted) return;
      setError(item instanceof Error ? item.message : "Haki Universal could not finish that brief.");
      setPhase("idle");
    }
  }

  function applyEvent(event: UniversalStreamEvent) {
    if (event.type === "plan") {
      setPlan(event.plan);
      setFilename(event.filename);
      setTarget(event.target);
      setThoughts((current) => (current.filter(Boolean).length ? event.plan.thoughts : current));
      return;
    }
    if (event.type === "status") {
      setStatus(event.text);
      return;
    }
    if (event.type === "thought") {
      setThoughts((current) => {
        const next = current.slice();
        next[event.index] = event.text;
        return next;
      });
      return;
    }
    if (event.type === "hit") {
      setPhase("collecting");
      setFound(event.found);
      setTarget(event.target);
      setRows((current) => [...current, event.row]);
      return;
    }
    if (event.type === "error") {
      setError(event.message);
      return;
    }
    if (event.type === "done") {
      setFound(event.found);
      setFilename(event.filename);
      setPhase("done");
    }
  }

  function toCsv() {
    return [
      columns.join(","),
      ...rows.map((row) => columns.map((column) => csv(row[column] ?? "")).join(",")),
    ].join("\n");
  }

  function download() {
    if (!rows.length || !columns.length) return;
    const blob = new Blob([toCsv()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function sendToImport() {
    if (!rows.length || sending) return;
    setSending(true);
    setError("");
    try {
      const file = new File([toCsv()], filename, { type: "text/csv" });
      const form = new FormData();
      form.append("file", file);
      const created = await api<{ id: string }>("/api/imports", { method: "POST", body: form });
      router.push(`/leads/import?id=${created.id}`);
    } catch (item) {
      setError(item instanceof Error ? item.message : "Could not send that file to import.");
    } finally {
      setSending(false);
    }
  }

  const pct = target ? Math.min(100, Math.round((found / target) * 100)) : 0;

  return (
    <div ref={splitRef} className="flex min-h-0 flex-1 bg-white">
      <section className="flex min-h-0 min-w-[240px] shrink-0 flex-col" style={{ width: `${planPct}%` }}>
        <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
          {plan ? (
            <div className="space-y-5">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-faint">Plan</div>
                <div className="mt-2 text-[16px] font-semibold tracking-[-0.02em]">{plan.title}</div>
                <div className="mt-1 text-[13px] text-muted">{brief || plan.audience}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Meta label="Geography" value={plan.geography} />
                <Meta label="Target" value={target ? `${target} records` : "—"} />
              </div>
              {plan.sources?.length ? (
                <div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-faint">Sources</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {plan.sources.map((source) => (
                      <span key={source} className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] text-accent">
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {columns.length ? (
                <div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-faint">Columns</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {columns.map((column) => (
                      <span key={column} className="rounded-full bg-[#f2f2f7] px-2 py-0.5 text-[11px] text-muted">
                        {column.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-faint">Chain of thought</div>
                <ol className="mt-3 space-y-2.5">
                  {(thoughts.length ? thoughts : plan.thoughts).map((thought, index) =>
                    thought ? (
                      <li key={`${index}-${thought}`} className="flex gap-3 text-[13px] leading-5 text-ink">
                        <span className="mt-0.5 w-5 shrink-0 font-mono text-[11px] text-faint">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {thought}
                      </li>
                    ) : null,
                  )}
                  {phase === "planning" ? <li className="text-[13px] text-muted">Locking the pass…</li> : null}
                </ol>
              </div>
              {plan.notes ? <p className="text-[12px] leading-5 text-muted">{plan.notes}</p> : null}
            </div>
          ) : (
            <div className="pt-8">
              <div className="font-serif text-[32px] leading-none tracking-[-0.03em]">Who should we collect?</div>
              <p className="mt-3 text-[13px] text-muted">Audience, place, and columns. The table opens on the right.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {HINTS.map((hint) => (
                  <button
                    key={hint}
                    type="button"
                    onClick={() => void run(hint)}
                    className="rounded-full border border-line bg-white px-3 py-1.5 text-[12px] text-muted hover:text-ink"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          )}
          {error ? <p className="mt-4 text-[13px] text-warn">{error}</p> : null}
        </div>

        <form
          className="border-t border-line px-6 py-4"
          onSubmit={(event) => {
            event.preventDefault();
            void run(input);
          }}
        >
          <div className="rounded-[18px] border border-line bg-[#f7f7f8] px-4 py-3">
            <textarea
              className="min-h-[56px] w-full resize-none bg-transparent text-[14px] outline-none placeholder:text-faint"
              placeholder="Get 100 founders details for mid sized startups from United States of America"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void run(input);
                }
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-faint">Beta · Wikidata + OpenStreetMap · review before import</p>
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8e8ed] text-ink hover:bg-accent hover:text-white disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>
      </section>

      <button
        type="button"
        aria-label="Resize plan and preview"
        onMouseDown={() => {
          dragging.current = true;
          document.body.style.cursor = "col-resize";
          document.body.style.userSelect = "none";
        }}
        className="group relative z-10 w-1.5 shrink-0 cursor-col-resize bg-line hover:bg-accent"
      >
        <span className="absolute inset-y-0 -left-1 -right-1" />
      </button>

      <aside className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#f7f7f8]">
        <div className="flex items-center justify-between gap-3 px-4 pt-4">
          <div>
            <div className="text-[14px] font-semibold tracking-[-0.02em]">Preview</div>
            <p className="mt-0.5 text-[12px] text-muted">
              {found} found{target ? ` · ${target} target` : ""} · {pct}% of the pass
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                phase === "collecting" ? "animate-pulse bg-good" : phase === "done" ? "bg-good" : "bg-[#d2d2d7]"
              }`}
            />
            <span className="text-[11px] uppercase tracking-[0.12em] text-faint">
              {phase === "collecting" ? "Collecting" : phase === "planning" ? "Planning" : phase === "done" ? "Complete" : "Idle"}
            </span>
            {phase === "done" && rows.length ? (
              <>
                <Button size="sm" variant="secondary" onClick={download}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  CSV
                </Button>
                <Button size="sm" onClick={() => void sendToImport()} disabled={sending}>
                  {sending ? "Sending…" : "Import"}
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <div className="mx-4 mt-3 h-1 overflow-hidden rounded-full bg-white">
          <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${pct}%` }} />
        </div>

        <div className="m-4 min-h-0 flex-1 overflow-hidden rounded-[12px] border border-line bg-white">
          {rows.length && columns.length ? (
            <div ref={tableRef} className="h-full overflow-auto">
              <table className="w-full min-w-[720px] text-left text-[12px]">
                <thead className="sticky top-0 bg-white text-[10px] uppercase tracking-[0.12em] text-faint">
                  <tr className="border-b border-line">
                    <th className="w-10 px-3 py-2.5 font-medium">#</th>
                    {columns.map((column) => (
                      <th key={column} className="px-3 py-2.5 font-medium">
                        {column.replace(/_/g, " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${index}-${row.company ?? row.email ?? ""}`} className="border-b border-line last:border-0">
                      <td className="px-3 py-2.5 font-mono text-[11px] text-faint">
                        {String(index + 1).padStart(2, "0")}
                      </td>
                      {columns.map((column) => (
                        <td key={column} className="max-w-[220px] truncate px-3 py-2.5 text-ink">
                          {row[column] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center px-8 text-center text-[13px] leading-6 text-muted">
              {status ||
                (phase === "planning"
                  ? "Plan is locking. Rows will land in this table as they resolve."
                  : "The collected file preview lives here, same as Haki AI.")}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-line bg-white px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.14em] text-faint">{label}</div>
      <div className="mt-1 truncate text-[13px] text-ink">{value}</div>
    </div>
  );
}

function csv(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
