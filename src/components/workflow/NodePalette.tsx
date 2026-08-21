"use client";

import { PALETTE, type PaletteItem } from "@/lib/workflow/nodes";
import { nodeIcon, nodeTone } from "./look";
import type { WorkflowNodeData } from "@/lib/types";

const GROUPS = [
  { id: "start", label: "Start", ids: ["trigger"] },
  { id: "channels", label: "Touches", ids: ["email", "whatsapp", "linkedin", "linkedin_connect", "sms", "instagram"] },
  { id: "intel", label: "Intel", ids: ["research_x", "research_youtube"] },
  { id: "logic", label: "Logic", ids: ["wait", "condition", "end"] },
];

export function NodePalette() {
  return (
    <div className="glass absolute bottom-4 left-1/2 z-10 w-[min(920px,calc(100%-2rem))] -translate-x-1/2 rounded-[16px] border border-line px-3 py-2.5 shadow-[0_12px_32px_rgba(29,29,31,0.1)]">
      <div className="flex flex-wrap items-end gap-3">
        {GROUPS.map((group) => (
          <div key={group.id} className="min-w-0">
            <div className="mb-1 px-1 text-[10px] font-medium uppercase tracking-[0.14em] text-faint">{group.label}</div>
            <div className="flex flex-wrap gap-1">
              {group.ids.map((id) => {
                const item = PALETTE.find((entry) => entry.id === id);
                if (!item) return null;
                return <Chip key={id} item={item} />;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Chip({ item }: { item: PaletteItem }) {
  const data = { label: item.label, type: item.type, ...item.data } as WorkflowNodeData;
  const tone = nodeTone(data);
  const Icon = nodeIcon(data);
  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("application/haki-node", JSON.stringify(item));
        event.dataTransfer.effectAllowed = "move";
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-medium text-ink hover:border-transparent hover:shadow-[0_0_0_2px_rgba(0,122,255,0.28)]"
    >
      <span className="flex h-4 w-4 items-center justify-center rounded-full" style={{ background: tone.soft, color: tone.ink }}>
        <Icon className="h-2.5 w-2.5" />
      </span>
      {item.label}
    </button>
  );
}

export function parsePaletteDrag(event?: React.DragEvent | null): PaletteItem | null {
  const raw = event?.dataTransfer?.getData("application/haki-node");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PaletteItem;
  } catch {
    return null;
  }
}
