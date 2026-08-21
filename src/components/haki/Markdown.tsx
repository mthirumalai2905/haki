import { polishChatReply } from "@/lib/hermes/prose";

const TOOL_LABELS: Record<string, string> = {
  get_workspace_context: "Read workspace",
  draft_campaign: "Drafted campaign",
  draft_multitouch_campaign: "Drafted multi-touch",
  draft_sequence: "Drafted sequence",
  draft_sequence_spec: "Drafted sequence",
  revise_sequence_spec: "Updated sequence",
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
  const blocks = splitBlocks(polishChatReply(text));
  return (
    <div className={`space-y-2.5 text-[14px] leading-6 ${invert ? "text-white" : "text-ink"}`}>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <div key={index} className="pt-1 text-[15px] font-semibold tracking-[-0.02em]">
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
        if (block.type === "table") {
          return (
            <div key={index} className="overflow-x-auto rounded-[10px] border border-line">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#f7f7f8] text-[11px] text-muted">
                  <tr>
                    {block.headers.map((header) => (
                      <th key={header} className="px-3 py-2 font-medium">
                        {inline(header, invert)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-line">
                      {row.map((cell, cellIndex) => (
                        <td key={`${rowIndex}-${cellIndex}`} className="px-3 py-1.5">
                          {inline(cell, invert)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

type Block =
  | { type: "heading"; text: string; items: string[]; headers: string[]; rows: string[][] }
  | { type: "list"; text: string; items: string[]; headers: string[]; rows: string[][] }
  | { type: "paragraph"; text: string; items: string[]; headers: string[]; rows: string[][] }
  | { type: "table"; text: string; items: string[]; headers: string[]; rows: string[][] };

function empty(type: Block["type"], extra?: Partial<Block>): Block {
  return { type, text: "", items: [], headers: [], rows: [], ...extra };
}

function splitBlocks(text: string) {
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let table: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(empty("paragraph", { text: paragraph.join(" ").trim() }));
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    blocks.push(empty("list", { items: list }));
    list = [];
  };
  const flushTable = () => {
    if (!table.length) return;
    const parsed = parseTable(table);
    if (parsed) blocks.push(empty("table", parsed));
    else blocks.push(empty("paragraph", { text: table.join(" ") }));
    table = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      flushList();
      flushTable();
      continue;
    }
    if (/^\|/.test(line) || (/\|/.test(line) && /\|[-: ]+\|/.test(line))) {
      flushParagraph();
      flushList();
      table.push(line);
      continue;
    }
    if (table.length && /\|/.test(line)) {
      table.push(line);
      continue;
    }
    flushTable();
    if (/^#{1,3}\s+/.test(line)) {
      flushParagraph();
      flushList();
      blocks.push(empty("heading", { text: line.replace(/^#{1,3}\s+/, "") }));
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
  flushTable();
  return blocks;
}

function parseTable(lines: string[]) {
  const rows = lines
    .map((line) =>
      line
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((cell) => cell.trim()),
    )
    .filter((row) => row.some((cell) => cell && !/^[-:]+$/.test(cell)));
  if (rows.length < 2) return null;
  return { headers: rows[0], rows: rows.slice(1) };
}

function inline(value: string, invert?: boolean) {
  const cleaned = value
    .replace(/\*\*([^*]+)\*\*/g, "«b»$1«/b»")
    .replace(/__([^_]+)__/g, "«b»$1«/b»")
    .replace(/\*([^*]+)\*/g, "«i»$1«/i»")
    .replace(/`([^`]+)`/g, "«c»$1«/c»")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/::+/g, ":");

  const parts = cleaned.split(/(«b».*?«\/b»|«i».*?«\/i»|«c».*?«\/c»)/g);
  return parts.map((part, index) => {
    if (part.startsWith("«c»")) {
      return (
        <code
          key={index}
          className={`rounded px-1 py-0.5 font-mono text-[12px] ${
            invert ? "bg-white/15 text-white" : "bg-[#f2f2f7] text-ink"
          }`}
        >
          {part.slice(3, -4)}
        </code>
      );
    }
    if (part.startsWith("«b»")) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(3, -4)}
        </strong>
      );
    }
    if (part.startsWith("«i»")) {
      return (
        <em key={index} className="italic">
          {part.slice(3, -4)}
        </em>
      );
    }
    return <span key={index}>{part}</span>;
  });
}
