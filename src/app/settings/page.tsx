"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";

type Settings = {
  workspace: { name: string };
  aiConfigured: boolean;
  counts: { leads: number; campaigns: number; imports: number };
};

type Icp = {
  name: string;
  industry?: string | null;
  companySize?: string | null;
  location?: string | null;
  jobTitle?: string | null;
  description?: string | null;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [icp, setIcp] = useState<Icp>({
    name: "Independent fried shops",
    industry: "Fried chicken",
    companySize: "2-50",
    location: "United States",
    jobTitle: "Owner / Operator",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<Settings>("/api/settings").then(setSettings);
    api<Icp[]>("/api/icp").then((items) => {
      if (items[0]) setIcp(items[0]);
    });
  }, []);

  return (
    <AppShell title="Settings" subtitle="Workspace, ICP, and AI configuration.">
      <div className="grid max-w-3xl gap-6">
        <section className="rounded-lg border border-line bg-surface p-5">
          <div className="text-sm font-medium">Workspace</div>
          <p className="mt-1 text-sm text-muted">{settings?.workspace.name || "Haki"} · {settings?.counts.leads ?? 0} leads · {settings?.counts.campaigns ?? 0} campaigns</p>
        </section>

        <section className="rounded-lg border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">DeepSeek</div>
            <Badge tone={settings?.aiConfigured ? "good" : "warn"}>
              {settings?.aiConfigured ? "Configured" : "Fallback heuristics"}
            </Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">
            Hermes is the orchestrator. DeepSeek is the reasoning model behind it.
            Set DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, and DEEPSEEK_MODEL in the server .env.
            The key never ships to the browser. Without a key, Hermes still drafts campaigns with a local harness.
          </p>
        </section>

        <section className="rounded-lg border border-line bg-surface p-5">
          <div className="text-sm font-medium">Ideal customer profile</div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {([
              ["name", "Name"],
              ["industry", "Industry"],
              ["companySize", "Company size"],
              ["location", "Location"],
              ["jobTitle", "Job title"],
            ] as const).map(([key, label]) => (
              <label key={key} className="text-sm">
                <div className="mb-1 text-[11px] uppercase tracking-[0.12em] text-faint">{label}</div>
                <input
                  className="field"
                  value={icp[key] ?? ""}
                  onChange={(event) => setIcp({ ...icp, [key]: event.target.value })}
                />
              </label>
            ))}
          </div>
          <textarea
            className="field mt-3 min-h-20"
            placeholder="Describe the ICP in natural language"
            value={icp.description ?? ""}
            onChange={(event) => setIcp({ ...icp, description: event.target.value })}
          />
          <div className="mt-3">
            <Button
              size="sm"
              onClick={async () => {
                await api("/api/icp", { method: "POST", body: JSON.stringify(icp) });
                setSaved(true);
              }}
            >
              Save ICP
            </Button>
            {saved ? <span className="ml-3 text-xs text-good">Saved</span> : null}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-surface p-5">
          <div className="text-sm font-medium">Haki AI sessions</div>
          <p className="mt-2 text-sm text-muted">
            Testing phase. Flush every chat session. Campaigns and leads stay put.
          </p>
          <Button
            className="mt-3"
            variant="danger"
            size="sm"
            onClick={async () => {
              await api("/api/hermes/sessions", { method: "DELETE" });
              sessionStorage.removeItem("haki:workspace-session");
              window.dispatchEvent(new Event("haki-sessions-changed"));
              window.location.href = "/haki";
            }}
          >
            Flush all sessions
          </Button>
        </section>

        <section className="rounded-lg border border-line bg-surface p-5">
          <div className="text-sm font-medium">Dummy data</div>
          <p className="mt-2 text-sm text-muted">
            Until your own list is ready, Haki loads 20 demo contacts with dummy social links, qualification scores, and a draft campaign.
          </p>
          <Button
            className="mt-3"
            variant="secondary"
            size="sm"
            onClick={async () => {
              await api("/api/sample", { method: "POST", body: JSON.stringify({ force: true }) });
              window.location.href = "/leads";
            }}
          >
            Reload dummy data
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
