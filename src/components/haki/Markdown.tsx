const TOOL_LABELS: Record<string, string> = {
  get_workspace_context: "Read workspace",
  draft_campaign: "Drafted campaign",
  draft_multitouch_campaign: "Drafted multi-touch",
  draft_sequence: "Drafted sequence",
  revise_campaign: "Updated campaign",
  qualify_leads: "Qualified leads",
  scope_gate: "Stayed in Haki",
  add_workflow_node: "Added node",
  remove_workflow_node: "Removed node",
  edit_workflow_node: "Edited node",
};

export function toolLabel(name: string) {
  return TOOL_LABELS[name] || name.replace(/_/g, " ");
}

export function Markdown({ text, invert }: { text: string; invert?: boolean }) {
  const blocks = splitBlocks(text);
  return (
    <div className={`space-y-2.5 text-[14px] leading-6 ${invert ? "text-white" : "text-ink"}`}>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <div key={index} className="pt-1 text-[13px] font-semibold tracking-[-0.02em]">
              {inline(block.text, invert)}
            </div>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={index} className="space-y-1 pl-4">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="list-disc">
                  {inline(item, invert)}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className={invert ? "text-white/95" : "text-ink"}>
            {inline(block.text, invert)}
          </p>
        );
      })}
    </div>
  );
}

function splitBlocks(text: string) {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: Array<{ type: "heading" | "list" | "paragraph"; text: string; items: string[] }> = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ type: "paragraph", text: paragraph.join(" ").trim(), items: [] });
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    blocks.push({ type: "list", text: "", items: list });
    list = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (/^#{1,3}\s+/.test(line)) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", text: line.replace(/^#{1,3}\s+/, ""), items: [] });
      continue;
    }
    if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      flushParagraph();
      list.push(line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""));
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}

function inline(value: string, invert?: boolean) {
  const parts = value.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className={`rounded px-1 py-0.5 font-mono text-[12px] ${
            invert ? "bg-white/15 text-white" : "bg-[#f2f2f7] text-ink"
          }`}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}
