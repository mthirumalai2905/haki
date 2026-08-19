"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

export function MessageEditor({
  channel,
  subject,
  body,
  goal,
  onChange,
}: {
  channel: string;
  subject?: string;
  body: string;
  goal?: string;
  onChange: (next: { subject?: string; body: string }) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function rewrite(instruction: string) {
    setBusy(true);
    const result = await api<{ body: string }>("/api/ai/message", {
      method: "POST",
      body: JSON.stringify({ body, instruction }),
    });
    onChange({ subject, body: result.body });
    setBusy(false);
  }

  async function generate() {
    setBusy(true);
    const result = await api<{ subject?: string | null; body: string }>("/api/ai/message", {
      method: "POST",
      body: JSON.stringify({ channel, goal }),
    });
    onChange({ subject: result.subject ?? subject, body: result.body });
    setBusy(false);
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium capitalize">{channel} message</div>
        <div className="flex flex-wrap gap-1">
          {[
            ["Generate", generate],
            ["Improve", () => rewrite("Improve this outreach message")],
            ["Shorten", () => rewrite("shorten")],
            ["Personalize", () => rewrite("make more personal")],
            ["Direct", () => rewrite("make more direct")],
          ].map(([label, fn]) => (
            <Button key={String(label)} size="sm" variant="ghost" disabled={busy} onClick={fn as () => void}>
              {label as string}
            </Button>
          ))}
        </div>
      </div>
      {channel === "email" ? (
        <input
          className="field mb-2"
          placeholder="Subject"
          value={subject ?? ""}
          onChange={(event) => onChange({ subject: event.target.value, body })}
        />
      ) : null}
      <textarea
        className="field min-h-40 font-sans"
        value={body}
        onChange={(event) => onChange({ subject, body: event.target.value })}
      />
      <div className="mt-2 text-[11px] text-faint">
        Variables: {"{{first_name}}"} {"{{company_name}}"} {"{{industry}}"} {"{{job_title}}"}
      </div>
    </div>
  );
}
