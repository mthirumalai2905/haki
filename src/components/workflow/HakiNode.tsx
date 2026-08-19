"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { WorkflowNodeData } from "@/lib/types";

const tones: Record<string, string> = {
  trigger: "bg-ink text-paper",
  action: "bg-surface text-ink",
  condition: "bg-info-soft text-info",
  wait: "bg-warn-soft text-warn",
  ai_decision: "bg-accent-soft text-ink",
  end: "bg-paper text-muted",
};

export function HakiNode({ data, selected }: NodeProps) {
  const node = data as WorkflowNodeData;
  return (
    <div className={`w-[200px] rounded-md border px-3 py-2.5 shadow-none ${selected ? "border-ink" : "border-line"} bg-surface`}>
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center justify-between">
        <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] ${tones[node.type] || tones.action}`}>
          {node.type.replace("_", " ")}
        </span>
        {node.channel ? <span className="text-[10px] text-faint">{node.channel}</span> : null}
      </div>
      <div className="mt-1.5 text-sm font-medium">{node.label}</div>
      {node.description ? <div className="text-[11px] text-muted">{node.description}</div> : null}
      {node.waitHours ? <div className="text-[11px] text-muted">{node.waitHours}h wait</div> : null}
      {node.weekdayOnly ? <div className="text-[11px] text-muted">Weekday only</div> : null}
      {node.type === "condition" ? (
        <>
          <Handle type="source" position={Position.Right} id="yes" />
          <Handle type="source" position={Position.Bottom} id="no" />
        </>
      ) : (
        <Handle type="source" position={Position.Bottom} />
      )}
    </div>
  );
}
