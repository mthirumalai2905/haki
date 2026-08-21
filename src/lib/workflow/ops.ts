import type { ActionKind, ChannelId, WorkflowGraph, WorkflowNodeData, WorkflowNodeType } from "../types";

export type GraphOp =
  | {
      kind: "add";
      nodeType?: "action" | "wait" | "condition";
      channel?: ChannelId;
      action?: ActionKind;
      label?: string;
      description?: string;
      waitHours?: number;
      condition?: WorkflowNodeData["condition"];
      sendAfterHour?: number;
      sendBeforeHour?: number;
      after?: string;
      before?: string;
      body?: string;
      subject?: string;
    }
  | {
      kind: "remove";
      nodeId?: string;
      step?: number;
      channel?: ChannelId;
      label?: string;
      type?: WorkflowNodeType;
    }
  | {
      kind: "edit";
      nodeId?: string;
      step?: number;
      channel?: ChannelId;
      label?: string;
      type?: WorkflowNodeType;
      patch: Partial<WorkflowNodeData>;
    };

export type GraphOpResult = {
  workflow: WorkflowGraph;
  changes: string[];
  changedNodeIds: string[];
  applied: boolean;
};

const CHANNEL_DEFAULTS: Partial<
  Record<ChannelId, { action: ActionKind; label: string; body?: string; subject?: string }>
> = {
  email: {
    action: "send_email",
    label: "Send email",
    subject: "Quick question about {{company_name}}",
    body: "Hi {{first_name}},\n\nI noticed {{company_name}} is growing in {{industry}}.\n\nWould a short conversation be useful?",
  },
  sms: {
    action: "send_sms",
    label: "Send SMS",
    body: "Hi {{first_name}} — following up on {{company_name}}. Free for a short chat?",
  },
  whatsapp: {
    action: "send_whatsapp",
    label: "WhatsApp",
    body: "Hi {{first_name}} — reaching {{company_name}} here.",
  },
  linkedin: {
    action: "send_linkedin",
    label: "LinkedIn message",
    body: "Hi {{first_name}} — following up after my note about {{company_name}}.",
  },
  phone: { action: "make_call", label: "Phone call" },
  x: { action: "research_x", label: "Check Twitter" },
  youtube: { action: "research_youtube", label: "Check YouTube" },
  reddit: { action: "send_reddit", label: "Reddit message" },
  instagram: { action: "send_linkedin", label: "Instagram" },
};

export function walkMainPath(graph: WorkflowGraph) {
  const trigger = graph.nodes.find((node) => node.data.type === "trigger");
  const seen = new Set<string>();
  const ordered: WorkflowGraph["nodes"] = [];
  let id = trigger?.id ?? graph.nodes[0]?.id;
  while (id && !seen.has(id)) {
    seen.add(id);
    const node = graph.nodes.find((item) => item.id === id);
    if (node) ordered.push(node);
    const edge =
      graph.edges.find((item) => item.source === id && (item.sourceHandle === "no" || !item.sourceHandle)) ??
      graph.edges.find((item) => item.source === id && item.sourceHandle !== "yes");
    id = edge?.target;
  }
  for (const node of graph.nodes) {
    if (!seen.has(node.id)) ordered.push(node);
  }
  return ordered;
}

export function applyGraphOps(graph: WorkflowGraph, ops: GraphOp[]): GraphOpResult {
  const workflow = cloneGraph(graph);
  const changes: string[] = [];
  const changedNodeIds: string[] = [];

  for (const op of ops) {
    if (op.kind === "add") {
      const data = nodeDataFromAdd(op);
      const after = resolveAnchor(workflow, op.after) ?? lastContinueNode(workflow);
      const id = insertAfter(workflow, after?.id, data);
      if (id) {
        if (data.type === "condition") {
          wireCondition(workflow, id);
          if (data.condition === "is_weekday") {
            for (const node of workflow.nodes) {
              if (node.data.type === "action") node.data.weekdayOnly = true;
            }
          }
        }
        changes.push(`Added ${data.label}${after ? ` after ${after.data.label}` : ""}`);
        changedNodeIds.push(id);
      }
    } else if (op.kind === "remove") {
      const targets = findNodes(workflow, op).filter((node) => node.data.type !== "trigger");
      if (!targets.length) continue;
      const ids = removeNodes(
        workflow,
        targets.map((node) => node.id),
      );
      if (ids.length) {
        changes.push(`Removed ${targets.map((node) => node.data.label).join(", ")}`);
        changedNodeIds.push(...ids);
      }
    } else {
      const targets = findNodes(workflow, op);
      for (const node of targets) {
        node.data = { ...node.data, ...op.patch };
        if (op.patch.channel && !op.patch.action) {
          const defaults = CHANNEL_DEFAULTS[op.patch.channel];
          if (defaults) {
            node.data.action = defaults.action;
            if (!op.patch.label) node.data.label = defaults.label;
          }
        }
        if (op.patch.waitHours != null && node.data.type === "wait") {
          node.data.label = `Wait ${op.patch.waitHours === 1 ? "1 hour" : `${op.patch.waitHours} hours`}`;
        }
        changes.push(`Edited ${node.data.label}`);
        changedNodeIds.push(node.id);
      }
    }
  }

  return {
    workflow,
    changes,
    changedNodeIds: [...new Set(changedNodeIds)],
    applied: changes.length > 0,
  };
}

export function parseTimeWindow(text: string) {
  const matches = [...text.matchAll(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/gi)];
  if (matches.length < 1) return null;
  if (matches.length === 1 && !/\b(between|window|only send|before|after|a\.?m|p\.?m)\b/i.test(text)) {
    return null;
  }
  const hours = matches.slice(0, 2).map((match, index, list) => {
    let hour = Number(match[1]);
    const meridiem = (match[3] || list[0][3] || "").toLowerCase();
    if (meridiem.startsWith("p") && hour < 12) hour += 12;
    if (meridiem.startsWith("a") && hour === 12) hour = 0;
    return hour;
  });
  if (!hours.length) return null;
  const after = hours[0];
  const before = hours[1] ?? Math.min(23, after + 1);
  if (after === before) return null;
  return { after, before };
}

export function parseGraphOps(message: string): GraphOp[] {
  const ops: GraphOp[] = [];
  if (/\b(weekend|weekday)\b/i.test(message) && /\b(check|cannot send|can't send|cant send|do not send|don't send|only send)\b/i.test(message)) {
    ops.push({
      kind: "add",
      nodeType: "condition",
      condition: "is_weekday",
      label: "Weekday check",
    });
  }
  const window = parseTimeWindow(message);
  if (window) {
    ops.push({
      kind: "add",
      nodeType: "condition",
      condition: "in_send_window",
      label: `Time window ${window.after}:00-${window.before}:00`,
      sendAfterHour: window.after,
      sendBeforeHour: window.before,
    });
  }
  const chunks = message.split(/\band then\b|\bthen\b|\band\b|;/i);

  for (const raw of chunks) {
    const text = raw.trim();
    if (!text) continue;

    if (/\b(remove|delete|drop|take out)\b/i.test(text)) {
      const step = text.match(/\bstep\s+(\d+)\b/i);
      const channel = readChannel(text);
      const type = /\bwait\b/i.test(text) ? ("wait" as const) : undefined;
      const label = text.match(/\b(?:the\s+)?["“]?([a-z][a-z0-9 ]{1,32})["”]?\s+node\b/i)?.[1];
      ops.push({
        kind: "remove",
        step: step ? Number(step[1]) : undefined,
        channel,
        type,
        label: label?.trim(),
      });
      continue;
    }

    if (/\b(add|insert|include|append|put)\b/i.test(text)) {
      const channel = readChannel(text);
      const hours = parseHours(text);
      const after = text.match(/\bafter(?:\s+the)?\s+([a-z0-9 ]+?)(?:\.|$)/i)?.[1]?.trim();
      const before = text.match(/\bbefore(?:\s+the)?\s+([a-z0-9 ]+?)(?:\.|$)/i)?.[1]?.trim();
      if (/\b(weekend|weekday|business day|working day)\b/i.test(text) && /\b(check|condition|node)\b/i.test(text)) {
        ops.push({
          kind: "add",
          nodeType: "condition",
          condition: "is_weekday",
          label: "Weekday check",
          after,
          before,
        });
        continue;
      }
      if (/\bwait\b/i.test(text) && !channel) {
        ops.push({ kind: "add", nodeType: "wait", waitHours: hours ?? 24, after, before });
        continue;
      }
      if (/\b(check|condition)\b/i.test(text) && !channel) {
        ops.push({
          kind: "add",
          nodeType: "condition",
          condition: "is_weekday",
          label: "Weekday check",
          after,
          before,
        });
        continue;
      }
      if (channel || /\bnode\b/i.test(text)) {
        ops.push({
          kind: "add",
          nodeType: "action",
          channel,
          waitHours: hours ?? undefined,
          after,
          before,
        });
      }
      continue;
    }

    if (/\b(edit|change|update|adjust|make|set)\b/i.test(text)) {
      const hours = parseHours(text);
      const channel = readChannel(text);
      const step = text.match(/\bstep\s+(\d+)\b/i);
      const weekday = /\bweekday/i.test(text);
      const patch: Partial<WorkflowNodeData> = {};
      if (hours != null) patch.waitHours = hours;
      if (weekday) patch.weekdayOnly = true;
      const toChannel = text.match(/\b(?:to|as|into)\s+(?:send\s+)?(email|sms|whatsapp|linkedin|phone|call|twitter|x|youtube)\b/i);
      if (toChannel) {
        const next = readChannel(toChannel[1]);
        if (next) patch.channel = next;
      }
      if (Object.keys(patch).length) {
        ops.push({
          kind: "edit",
          step: step ? Number(step[1]) : undefined,
          channel: patch.channel ? undefined : channel,
          type: hours != null && !channel ? "wait" : undefined,
          patch,
        });
      }
    }
  }

  return ops.filter((op) => {
    if (op.kind === "add") return Boolean(op.channel || op.nodeType === "wait" || op.nodeType === "condition");
    if (op.kind === "remove") return Boolean(op.nodeId || op.step || op.channel || op.label || op.type);
    return Object.keys(op.patch).length > 0;
  });
}

function nodeDataFromAdd(op: Extract<GraphOp, { kind: "add" }>): WorkflowNodeData {
  if (op.nodeType === "wait" || (!op.channel && op.waitHours != null)) {
    const hours = op.waitHours ?? 24;
    return {
      type: "wait",
      label: `Wait ${hours === 1 ? "1 hour" : `${hours} hours`}`,
      waitHours: hours,
    };
  }
  if (op.nodeType === "condition") {
    return {
      type: "condition",
      label:
        op.label ||
        (op.condition === "is_weekday"
          ? "Weekday check"
          : op.condition === "in_send_window"
            ? "Time window"
            : "Has replied?"),
      condition: op.condition || "any_engagement",
      sendAfterHour: op.sendAfterHour,
      sendBeforeHour: op.sendBeforeHour,
    };
  }
  const defaults = op.channel ? CHANNEL_DEFAULTS[op.channel] : undefined;
  return {
    type: "action",
    label: op.label || defaults?.label || "New step",
    description: op.description || "Added from chat",
    action: op.action || defaults?.action,
    channel: op.channel,
    available: true,
    body: op.body || defaults?.body,
    subject: op.subject || defaults?.subject,
  };
}

function findNodes(
  graph: WorkflowGraph,
  selector: { nodeId?: string; step?: number; channel?: ChannelId; label?: string; type?: WorkflowNodeType },
) {
  if (selector.nodeId) return graph.nodes.filter((node) => node.id === selector.nodeId);
  if (selector.step != null) {
    const steps = graph.nodes.filter((node) => node.data.type !== "trigger");
    const node = steps[selector.step - 1];
    return node ? [node] : [];
  }
  return graph.nodes.filter((node) => {
    if (selector.type && node.data.type !== selector.type) return false;
    const channelHit =
      selector.channel &&
      (node.data.channel === selector.channel || node.data.action === channelAction(selector.channel));
    const labelHit = selector.label && node.data.label.toLowerCase().includes(selector.label.toLowerCase());
    if (selector.channel && selector.label) return Boolean(channelHit || labelHit);
    if (selector.channel) return Boolean(channelHit);
    if (selector.label) return Boolean(labelHit);
    return Boolean(selector.type);
  });
}

function resolveAnchor(graph: WorkflowGraph, value?: string) {
  if (!value) return undefined;
  const trimmed = value.replace(/\b(the|a|an|node|step)\b/gi, "").trim();
  const step = trimmed.match(/^(\d+)$/);
  if (step) return findNodes(graph, { step: Number(step[1]) })[0];
  const channel = readChannel(trimmed);
  if (channel) return findNodes(graph, { channel })[0];
  return (
    graph.nodes.find((node) => node.data.label.toLowerCase().includes(trimmed.toLowerCase())) ??
    graph.nodes.find((node) => node.id === trimmed)
  );
}

function wireCondition(graph: WorkflowGraph, conditionId: string) {
  const forward = graph.edges.find((edge) => edge.source === conditionId && !edge.sourceHandle);
  if (forward) {
    forward.sourceHandle = "yes";
    forward.label = "yes";
    forward.id = `${conditionId}-${forward.target}-yes`;
  }
  const waitId = nextId(graph);
  const source = graph.nodes.find((node) => node.id === conditionId);
  graph.nodes.push({
    id: waitId,
    type: "haki",
    position: {
      x: (source?.position.x ?? 80) + 80,
      y: (source?.position.y ?? 160) + 140,
    },
    data: { type: "wait", label: "Wait for weekday", waitHours: 24 },
  });
  graph.edges.push({
    id: `${conditionId}-${waitId}-no`,
    source: conditionId,
    target: waitId,
    sourceHandle: "no",
    label: "no",
  });
  graph.edges.push({
    id: `${waitId}-${conditionId}`,
    source: waitId,
    target: conditionId,
  });
}

function lastContinueNode(graph: WorkflowGraph) {
  const end =
    graph.nodes.find((node) => node.data.type === "end" && /complete/i.test(node.data.label)) ??
    [...graph.nodes].reverse().find((node) => node.data.type === "end");
  if (!end) return graph.nodes[graph.nodes.length - 1];
  const incoming = graph.edges.filter((edge) => edge.target === end.id && edge.sourceHandle !== "yes");
  return graph.nodes.find((node) => node.id === incoming[incoming.length - 1]?.source) ?? end;
}

function insertAfter(graph: WorkflowGraph, afterId: string | undefined, data: WorkflowNodeData) {
  const source = afterId ? graph.nodes.find((node) => node.id === afterId) : lastContinueNode(graph);
  if (!source) return null;
  if (source.data.type === "end") {
    return insertBefore(graph, source.id, data);
  }

  const outgoing =
    graph.edges.find((edge) => edge.source === source.id && (edge.sourceHandle === "no" || !edge.sourceHandle)) ??
    graph.edges.find((edge) => edge.source === source.id && edge.sourceHandle !== "yes");

  const id = nextId(graph);
  const y = source.position.y + 120;
  const created = {
    id,
    type: "haki",
    position: { x: source.position.x, y },
    data,
  };
  const sourceIndex = graph.nodes.findIndex((node) => node.id === source.id);
  graph.nodes.splice(sourceIndex + 1, 0, created);

  if (outgoing) {
    const previousTarget = outgoing.target;
    outgoing.target = id;
    outgoing.id = `${outgoing.source}-${id}${outgoing.label ? `-${outgoing.label}` : ""}`;
    graph.edges.push({ id: `${id}-${previousTarget}`, source: id, target: previousTarget });
  } else {
    graph.edges.push({ id: `${source.id}-${id}`, source: source.id, target: id });
  }

  for (const node of graph.nodes) {
    if (node.id !== id && node.position.y >= y) node.position.y += 120;
  }
  return id;
}

function insertBefore(graph: WorkflowGraph, beforeId: string, data: WorkflowNodeData) {
  const target = graph.nodes.find((node) => node.id === beforeId);
  if (!target) return null;
  const id = nextId(graph);
  graph.nodes.push({
    id,
    type: "haki",
    position: { x: target.position.x, y: target.position.y },
    data,
  });
  target.position = { ...target.position, y: target.position.y + 120 };
  const incoming = graph.edges.filter((edge) => edge.target === beforeId);
  for (const edge of incoming) {
    edge.target = id;
    edge.id = `${edge.source}-${id}${edge.label ? `-${edge.label}` : ""}`;
  }
  graph.edges.push({ id: `${id}-${beforeId}`, source: id, target: beforeId });
  return id;
}

function removeNodes(graph: WorkflowGraph, ids: string[]) {
  const removed = new Set(ids.filter((id) => graph.nodes.some((node) => node.id === id && node.data.type !== "trigger")));
  if (!removed.size) return [];

  for (const id of removed) {
    const incoming = graph.edges.filter((edge) => edge.target === id);
    const outgoing = graph.edges.filter((edge) => edge.source === id);
    for (const inEdge of incoming) {
      for (const outEdge of outgoing) {
        graph.edges.push({
          id: `${inEdge.source}-${outEdge.target}${inEdge.label ? `-${inEdge.label}` : ""}`,
          source: inEdge.source,
          target: outEdge.target,
          sourceHandle: inEdge.sourceHandle,
          label: inEdge.label,
        });
      }
    }
  }

  graph.nodes = graph.nodes.filter((node) => !removed.has(node.id));
  graph.edges = graph.edges.filter((edge) => !removed.has(edge.source) && !removed.has(edge.target));
  return [...removed];
}

function readChannel(text: string): ChannelId | undefined {
  const value = text.toLowerCase();
  if (/\bwhatsapp\b/.test(value)) return "whatsapp";
  if (/\b(sms|text message)\b/.test(value)) return "sms";
  if (/\blinkedin\b/.test(value)) return "linkedin";
  if (/\b(phone|call)\b/.test(value)) return "phone";
  if (/\b(youtube)\b/.test(value)) return "youtube";
  if (/\b(twitter|\bx\b)\b/.test(value)) return "x";
  if (/\breddit\b/.test(value)) return "reddit";
  if (/\binstagram\b/.test(value)) return "instagram";
  if (/\bemail\b/.test(value)) return "email";
  return undefined;
}

function channelAction(channel: ChannelId): ActionKind | undefined {
  return CHANNEL_DEFAULTS[channel]?.action;
}

function parseHours(text: string) {
  const to = text.match(/\bto\s+(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)?\b/i);
  if (to) return Number(to[1]);
  const hours = text.match(/\b(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)\b/i);
  if (hours) return Number(hours[1]);
  return null;
}

function nextId(graph: WorkflowGraph) {
  const nums = graph.nodes.map((node) => Number(String(node.id).replace(/\D/g, ""))).filter((value) => Number.isFinite(value));
  return `n${(nums.length ? Math.max(...nums) : 0) + 1}`;
}

function cloneGraph(graph: WorkflowGraph): WorkflowGraph {
  return {
    name: graph.name,
    nodes: graph.nodes.map((node) => ({
      ...node,
      position: { ...node.position },
      data: { ...node.data },
    })),
    edges: graph.edges.map((edge) => ({ ...edge })),
  };
}
