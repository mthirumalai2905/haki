"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { SequenceStepView, StepConfig } from "@/lib/sequence/types";

export function SequenceDesk({ campaignId }: { campaignId: string }) {
  const [steps, setSteps] = useState<SequenceStepView[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [chat, setChat] = useState("Email, then a LinkedIn message 2 days later, then SMS 3 days after that if no reply.");
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await api<{ steps: SequenceStepView[] }>(`/api/campaigns/${campaignId}/steps`);
    setSteps(data.steps);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, [campaignId]);

  async function move(index: number, delta: number) {
    const next = index + delta;
    if (next < 0 || next >= steps.length) return;
    const copy = [...steps];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    setSteps(copy);
    await api(`/api/campaigns/${campaignId}/steps`, {
      method: "PATCH",
      body: JSON.stringify({ steps: copy }),
    });
    await load();
  }

  async function ask() {
    setBusy(true);
    try {
      const data = await api<{ steps: SequenceStepView[] }>(`/api/campaigns/${campaignId}/steps`, {
        method: "POST",
        body: JSON.stringify({ request: chat }),
      });
      setSteps(data.steps);
    } finally {
      setBusy(false);
    }
  }

  const selected = steps.find((step) => step.id === openId) ?? null;

  return (
    <div className="grid min-h-[520px] gap-4 lg:grid-cols-[1fr_320px]">
      <div className="rounded-[12px] border border-line bg-white">
        <div className="border-b border-line px-4 py-3">
          <div className="text-[14px] font-semibold">Sequence</div>
          <p className="text-[12px] text-muted">Chat authors the path. The canvas remains a compiled fallback.</p>
        </div>
        <div className="divide-y divide-line">
          {steps.length ? (
            steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setOpenId(step.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left ${openId === step.id ? "bg-accent-soft" : "hover:bg-[#f7f7f8]"}`}
              >
                <span className="font-mono text-[11px] text-faint">{String(index + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium capitalize">{step.channel.replace("_", " ")}</div>
                  <div className="truncate text-[12px] text-muted">{step.summary}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[11px] text-faint hover:text-ink"
                    onClick={(event) => {
                      event.stopPropagation();
                      void move(index, -1);
                    }}
                  >
                    Up
                  </span>
                  <span
                    className="text-[11px] text-faint hover:text-ink"
                    onClick={(event) => {
                      event.stopPropagation();
                      void move(index, 1);
                    }}
                  >
                    Down
                  </span>
                  <div className="text-right text-[11px] text-faint">
                    {step.delayHours ? `+${step.delayHours}h` : "now"}
                    {step.editedByUser ? " · edited" : ""}
                    {step.videoEnabled ? ` · video ${step.videoStatus}` : ""}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <p className="px-4 py-10 text-[13px] text-muted">Describe the path in chat. Haki will draft ordered steps.</p>
          )}
        </div>
      </div>

      <aside className="flex flex-col gap-3">
        <div className="rounded-[12px] border border-line bg-white p-3">
          <div className="text-[13px] font-medium">Ask Haki</div>
          <textarea
            className="mt-2 min-h-[88px] w-full resize-none rounded-[8px] border border-line bg-[#fafafa] px-3 py-2 text-[13px] outline-none"
            value={chat}
            onChange={(event) => setChat(event.target.value)}
          />
          <Button size="sm" className="mt-2 w-full" disabled={busy} onClick={ask}>
            {busy ? "Drafting…" : steps.length ? "Revise sequence" : "Draft sequence"}
          </Button>
        </div>
        {selected ? (
          <StepEditor
            campaignId={campaignId}
            step={selected}
            onClose={() => setOpenId(null)}
            onChanged={load}
          />
        ) : null}
      </aside>
    </div>
  );
}

function StepEditor({
  campaignId,
  step,
  onClose,
  onChanged,
}: {
  campaignId: string;
  step: SequenceStepView;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const [config, setConfig] = useState<StepConfig>(step.config);
  const [delayHours, setDelayHours] = useState(step.delayHours);
  const [videoEnabled, setVideoEnabled] = useState(step.videoEnabled);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setConfig(step.config);
    setDelayHours(step.delayHours);
    setVideoEnabled(Boolean(step.videoEnabled));
  }, [step]);

  async function save() {
    setSaving(true);
    try {
      await api(`/api/campaigns/${campaignId}/steps/${step.id}`, {
        method: "PATCH",
        body: JSON.stringify({ config, delayHours, videoEnabled, editedByUser: true }),
      });
      await onChanged();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[12px] border border-line bg-white p-3">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-medium capitalize">{step.channel.replace("_", " ")}</div>
        <button type="button" className="text-[12px] text-faint" onClick={onClose}>
          Close
        </button>
      </div>
      <label className="mt-3 block text-[11px] text-faint">Delay before this step (hours)</label>
      <input
        type="number"
        min={0}
        value={delayHours}
        onChange={(event) => setDelayHours(Number(event.target.value))}
        className="mt-1 w-full rounded-[8px] border border-line px-2 py-1.5 text-[13px]"
      />
      {step.channel === "email" ? (
        <>
          <label className="mt-3 block text-[11px] text-faint">Subject</label>
          <input
            value={config.subject ?? ""}
            onChange={(event) => setConfig({ ...config, subject: event.target.value })}
            className="mt-1 w-full rounded-[8px] border border-line px-2 py-1.5 text-[13px]"
          />
          <label className="mt-3 block text-[11px] text-faint">Body · tokens like {"{{first_name}}"} stay</label>
          <textarea
            value={config.body ?? ""}
            onChange={(event) => setConfig({ ...config, body: event.target.value })}
            className="mt-1 min-h-[140px] w-full rounded-[8px] border border-line px-2 py-1.5 text-[13px]"
          />
          <label className="mt-3 flex items-center gap-2 text-[12px]">
            <input
              type="checkbox"
              checked={Boolean(videoEnabled)}
              onChange={(event) => setVideoEnabled(event.target.checked)}
            />
            Include AI video
          </label>
          <p className="mt-1 text-[11px] text-faint">
            Off by default. Per-lead simulated presenter. Status: {step.videoStatus || "off"}.
          </p>
        </>
      ) : step.channel === "linkedin" ? (
        <>
          <label className="mt-3 block text-[11px] text-faint">Message</label>
          <textarea
            value={config.message ?? ""}
            onChange={(event) => setConfig({ ...config, message: event.target.value })}
            className="mt-1 min-h-[100px] w-full rounded-[8px] border border-line px-2 py-1.5 text-[13px]"
          />
          <label className="mt-3 block text-[11px] text-faint">Connection note</label>
          <textarea
            value={config.connectionNote ?? ""}
            onChange={(event) => setConfig({ ...config, connectionNote: event.target.value })}
            className="mt-1 min-h-[72px] w-full rounded-[8px] border border-line px-2 py-1.5 text-[13px]"
          />
        </>
      ) : step.channel === "call_task" || step.channel === "phone" ? (
        <>
          <label className="mt-3 block text-[11px] text-faint">Task notes</label>
          <textarea
            value={config.taskNotes ?? ""}
            onChange={(event) => setConfig({ ...config, taskNotes: event.target.value })}
            className="mt-1 min-h-[100px] w-full rounded-[8px] border border-line px-2 py-1.5 text-[13px]"
          />
        </>
      ) : (
        <>
          <label className="mt-3 block text-[11px] text-faint">Message</label>
          <textarea
            value={config.message ?? config.body ?? ""}
            onChange={(event) => setConfig({ ...config, message: event.target.value })}
            className="mt-1 min-h-[100px] w-full rounded-[8px] border border-line px-2 py-1.5 text-[13px]"
          />
        </>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save step"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            await api(`/api/campaigns/${campaignId}/steps/${step.id}/duplicate`, { method: "POST" });
            await onChanged();
          }}
        >
          Duplicate
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            await api(`/api/campaigns/${campaignId}/steps/${step.id}`, { method: "DELETE" });
            onClose();
            await onChanged();
          }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
