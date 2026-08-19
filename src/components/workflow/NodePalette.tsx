"use client";

import { PALETTE, type PaletteItem } from "@/lib/workflow/nodes";

export function NodePalette() {
  return (
    <div className="glass absolute bottom-4 left-4 z-10 flex flex-wrap gap-1 rounded-[12px] border border-line p-2">
      {PALETTE.map((item) => (
        <button
          key={item.id}
          type="button"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData("application/haki-node", JSON.stringify(item));
            event.dataTransfer.effectAllowed = "move";
          }}
          className="rounded-md border border-line bg-paper px-2 py-1 text-[11px] text-muted hover:border-ink hover:text-ink"
        >
          {item.label}
        </button>
      ))}
    </div>
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
