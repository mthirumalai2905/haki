"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Metric } from "@/components/ui/Metric";
import { api } from "@/lib/api";
import { FIELD_LABELS } from "@/lib/import/map";
import { LEAD_FIELDS, type FieldMapping } from "@/lib/types";
import { formatBytes, formatNumber } from "@/lib/utils";

const STEPS = ["Upload", "Map", "Preview", "Import"];

type ImportRecord = {
  id: string;
  fileName: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  headers: string[];
  mappings: FieldMapping[];
  preview: Record<string, string>[];
  stats: {
    rows: number;
    columns: number;
    validEmails: number;
    validPhones: number;
    duplicates: number;
    missingFields: number;
  };
};

export default function ImportPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [item, setItem] = useState<ImportRecord | null>(null);
  const [result, setResult] = useState<{ imported: number; validEmails: number; validPhones: number } | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) return;
    void (async () => {
      setBusy(true);
      setError("");
      try {
        const created = await api<ImportRecord>(`/api/imports/${id}`);
        setItem(created);
        setStep(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not open that file.");
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  const mappedPreview = useMemo(() => {
    if (!item) return [];
    return item.preview.map((row) => {
      const next: Record<string, string> = {};
      for (const mapping of item.mappings) {
        const label = mapping.target === "custom" ? mapping.source : FIELD_LABELS[mapping.target] || mapping.source;
        if (mapping.target === "ignore") continue;
        next[label] = row[mapping.source] ?? "";
      }
      return next;
    });
  }, [item]);

  async function onFile(file: File) {
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const created = await api<ImportRecord>("/api/imports", { method: "POST", body: form });
      setItem(created);
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Import" subtitle="Bring an existing dataset into Haki.">
      <div className="mb-8 flex items-center gap-6">
        {STEPS.map((label, index) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${index <= step ? "bg-ink text-paper" : "bg-accent-soft text-muted"}`}>
              {String(index + 1).padStart(2, "0")}
            </div>
            <span className={index === step ? "text-sm text-ink" : "text-sm text-muted"}>{label}</span>
          </div>
        ))}
      </div>

      {error ? <div className="mb-4 text-sm text-bad">{error}</div> : null}

      {step === 0 && (
        <label className="flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line-strong bg-surface">
          <div className="font-serif text-3xl">Import your leads</div>
          <p className="mt-3 text-sm text-muted">Drop a CSV or XLSX file here, or choose a file.</p>
          <p className="mt-1 text-xs text-faint">JSON is also accepted. Haki does not scrape or source leads.</p>
          <a href="/sample-leads.csv" className="mt-2 text-xs text-ink underline">Download a sample CSV</a>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onFile(file);
            }}
          />
          <div className="mt-5">
            <Button disabled={busy}>{busy ? "Reading file..." : "Choose a file"}</Button>
          </div>
        </label>
      )}

      {step === 1 && item && (
        <div>
          <div className="mb-4 text-sm text-muted">
            {item.fileName} · {formatNumber(item.rowCount)} rows · {item.columnCount} columns · {formatBytes(item.fileSize)}
          </div>
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            {item.mappings.map((mapping, index) => (
              <div key={mapping.source} className="grid grid-cols-[1fr_40px_1fr_100px] items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                <div className="text-sm">{mapping.source}</div>
                <div className="text-faint">→</div>
                <select
                  value={mapping.target}
                  className="h-8 rounded-md border border-line bg-paper px-2 text-sm"
                  onChange={(event) => {
                    const mappings = item.mappings.map((entry, i) =>
                      i === index ? { ...entry, target: event.target.value as FieldMapping["target"] } : entry,
                    );
                    setItem({ ...item, mappings });
                  }}
                >
                  {LEAD_FIELDS.map((field) => (
                    <option key={field} value={field}>{FIELD_LABELS[field]}</option>
                  ))}
                  <option value="custom">Custom field</option>
                  <option value="ignore">Ignore</option>
                </select>
                <Badge tone={mapping.confidence === "high" ? "good" : mapping.confidence === "medium" ? "warn" : "neutral"}>
                  {mapping.confidence}
                </Badge>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setStep(0)}>Back</Button>
            <Button
              onClick={async () => {
                setBusy(true);
                const updated = await api<ImportRecord>(`/api/imports/${item.id}/map`, {
                  method: "PATCH",
                  body: JSON.stringify({ mappings: item.mappings }),
                });
                setItem(updated);
                setStep(2);
                setBusy(false);
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 2 && item && (
        <div>
          <div className="mb-4 text-sm text-muted">
            Showing {Math.min(100, item.preview.length)} of {formatNumber(item.rowCount)} records
          </div>
          <div className="mb-4 grid grid-cols-6 gap-3">
            <Metric label="Rows" value={formatNumber(item.stats.rows || item.rowCount)} />
            <Metric label="Columns" value={formatNumber(item.stats.columns || item.columnCount)} />
            <Metric label="Valid emails" value={formatNumber(item.stats.validEmails)} />
            <Metric label="Valid phones" value={formatNumber(item.stats.validPhones)} />
            <Metric label="Duplicates" value={formatNumber(item.stats.duplicates)} />
            <Metric label="Missing fields" value={formatNumber(item.stats.missingFields)} />
          </div>
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <div className="scrollbar-thin overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-line bg-paper text-[11px] uppercase tracking-[0.12em] text-faint">
                  <tr>
                    {Object.keys(mappedPreview[0] ?? {}).map((header) => (
                      <th key={header} className="px-3 py-2 font-medium">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mappedPreview.map((row, index) => (
                    <tr key={index} className="border-b border-line last:border-0">
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="whitespace-nowrap px-3 py-2 text-muted">{value || "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setStep(3);
                const imported = await api<{ imported: number; validEmails: number; validPhones: number }>(
                  `/api/imports/${item.id}/confirm`,
                  { method: "POST" },
                );
                setResult(imported);
                setBusy(false);
              }}
            >
              Import leads
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="rounded-lg border border-line bg-surface px-8 py-10">
          <div className="font-serif text-3xl">
            {result ? `${formatNumber(result.imported)} leads imported` : "Importing leads..."}
          </div>
          {result ? (
            <p className="mt-3 text-sm text-muted">
              {formatNumber(result.validEmails)} valid emails · {formatNumber(result.validPhones)} valid phones
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted">Normalizing companies, contacts, and custom fields.</p>
          )}
          <div className="mt-6 flex gap-2">
            <Button onClick={() => router.push("/campaigns/new")} disabled={!result}>Create campaign</Button>
            <Button variant="secondary" onClick={() => router.push("/leads")} disabled={!result}>View leads</Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
