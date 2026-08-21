"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { WorkflowNodeData } from "@/lib/types";
import { nodeIcon, nodeKind, nodeTone } from "./look";

export function HakiNode({ data, selected }: NodeProps) {
  const node = data as WorkflowNodeData;
  const tone = nodeTone(node);
  const Icon = nodeIcon(node);
  const preview = node.subject || node.body || node.description;

  return (
    <div
      className={`relative w-[228px] rounded-[14px] border bg-white px-3.5 py-3 transition-shadow ${
        selected
          ? "border-transparent shadow-[0_0_0_2px_#007aff,0_10px_24px_rgba(0,122,255,0.14)]"
          : "border-line shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_8px_20px_rgba(29,29,31,0.06)]"
      }`}
    >
      <span className="absolute inset-y-3 left-0 w-[3px] rounded-full" style={{ background: tone.ink }} />
      <Handle type="target" position={Position.Top} />
      <div className="flex items-start gap-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
          style={{ background: tone.soft, color: tone.ink }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-faint">{nodeKind(node)}</span>
            {node.weekdayOnly ? <span className="text-[10px] text-warn">Weekday</span> : null}
          </div>
          <div className="mt-0.5 truncate text-[13px] font-semibold tracking-[-0.02em] text-ink">{node.label}</div>
        </div>
      </div>
      {node.waitHours ? (
        <div className="mt-2 text-[12px] text-muted">{node.waitHours} hours, then the next touch</div>
      ) : preview ? (
        <div className="mt-2 line-clamp-2 text-[12px] leading-snug text-muted">{preview}</div>
      ) : null}
      {node.type === "condition" ? (
        <>
          <Handle type="source" position={Position.Right} id="yes" />
          <Handle type="source" position={Position.Bottom} id="no" />
          <span className="pointer-events-none absolute -right-8 top-[42%] text-[10px] font-medium text-good">yes</span>
          <span className="pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-medium text-warn">
            no
          </span>
        </>
      ) : (
        <Handle type="source" position={Position.Bottom} />
      )}
    </div>
  );
}
