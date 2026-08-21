"use client";

import type { WorkflowNodeData } from "@/lib/types";
import { CHANNELS } from "@/lib/types";
import { nodeIcon, nodeKind, nodeTone } from "./look";

export function NodePanel({
  nodeId,
  data,
  onChange,
  onClose,
}: {
  nodeId: string;
  data: WorkflowNodeData;
  onChange: (nodeId: string, data: WorkflowNodeData) => void;
  onClose: () => void;
}) {
  const update = (patch: Partial<WorkflowNodeData>) => onChange(nodeId, { ...data, ...patch });
  const tone = nodeTone(data);
  const Icon = nodeIcon(data);

  return (
    <aside className="w-[340px] shrink-0 overflow-auto border-l border-line bg-white">
      <div className="border-b border-line px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-[12px]"
              style={{ background: tone.soft, color: tone.ink }}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">{nodeKind(data)}</div>
              <div className="mt-0.5 text-[15px] font-semibold tracking-[-0.02em]">{data.label}</div>
            </div>
          </div>
          <button type="button" className="text-xs text-muted hover:text-ink" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="mt-3 text-[12px] leading-snug text-muted">
          Edit this step. The rest of the path stays. Review before any campaign uses it.
        </p>
      </div>
      <div className="space-y-4 p-4 text-sm">
        <Field label="Label">
          <input className="field" value={data.label} onChange={(e) => update({ label: e.target.value })} />
        </Field>
        <Field label="Description">
          <input className="field" value={data.description ?? ""} onChange={(e) => update({ description: e.target.value })} />
        </Field>
        {data.type === "action" ? (
          <>
            <Field label="Channel">
              <select
                className="field"
                value={data.channel ?? "email"}
                onChange={(e) => {
                  const channel = CHANNELS.find((item) => item.id === e.target.value);
                  update({
                    channel: channel?.id,
                    action: channel?.action,
                    available: channel?.implemented,
                  });
                }}
              >
                {CHANNELS.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.label}
                    {channel.implemented ? "" : " · coming soon"}
                  </option>
                ))}
              </select>
            </Field>
            {data.channel === "email" ? (
              <Field label="Subject">
                <input className="field" value={data.subject ?? ""} onChange={(e) => update({ subject: e.target.value })} />
              </Field>
            ) : null}
            <Field label="Message">
              <textarea
                className="field min-h-36"
                value={data.body ?? ""}
                onChange={(e) => update({ body: e.target.value })}
              />
            </Field>
            <label className="flex items-center gap-2 rounded-[10px] bg-paper px-3 py-2 text-[13px]">
              <input
                type="checkbox"
                checked={Boolean(data.weekdayOnly)}
                onChange={(e) => update({ weekdayOnly: e.target.checked })}
              />
              Weekdays only
            </label>
          </>
        ) : null}
        {data.type === "wait" ? (
          <Field label="Wait hours">
            <input
              type="number"
              className="field"
              value={data.waitHours ?? 24}
              onChange={(e) => update({ waitHours: Number(e.target.value) })}
            />
          </Field>
        ) : null}
        {data.type === "condition" ? (
          <Field label="Condition">
            <select
              className="field"
              value={data.condition ?? "email_replied"}
              onChange={(e) => update({ condition: e.target.value as WorkflowNodeData["condition"] })}
            >
              <option value="email_replied">Email replied</option>
              <option value="email_opened">Email opened</option>
              <option value="any_engagement">Any engagement</option>
              <option value="no_response">No response</option>
              <option value="positive_reply">Positive reply</option>
              <option value="linkedin_replied">LinkedIn replied</option>
              <option value="meeting_booked">Meeting booked</option>
              <option value="is_weekday">Is a weekday</option>
              <option value="in_send_window">Inside send window</option>
            </select>
          </Field>
        ) : null}
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-faint">{label}</div>
      {children}
    </label>
  );
}
