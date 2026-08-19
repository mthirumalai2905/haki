import type { ActionKind, ChannelId, ConditionKind, WorkflowGraph, WorkflowNodeData } from "../types";
import { multiTouchMessages } from "./multitouch";
import type { HermesProposal } from "../hermes/types";

export type WorkflowRevision = {
  workflow: WorkflowGraph;
  changes: string[];
  changedNodeIds: string[];
  applied: boolean;
};

type TouchSpec = {
  match: RegExp;
  channel: ChannelId;
  action: ActionKind;
  label: string;
  description?: string;
  body?: string;
  subject?: string;
  condition?: ConditionKind;
};

const TOUCHES: TouchSpec[] = [
  {
    match: /\b(sms|text message|text)\b/i,
    channel: "sms",
    action: "send_sms",
    label: "Send SMS",
    body: "Hi {{first_name}} — following up on {{company_name}}. Free for a short chat?",
    condition: "sms_replied",
  },
  {
    match: /\bemail\b/i,
    channel: "email",
    action: "send_email",
    label: "Send email",
    subject: "Quick question about {{company_name}}",
    body: "Hi {{first_name}},\n\nI noticed {{company_name}} is growing in {{industry}}.\n\nWould a short conversation be useful?",
    condition: "email_replied",
  },
  {
    match: /\bwhatsapp\b/i,
    channel: "whatsapp",
    action: "send_whatsapp",
    label: "WhatsApp",
    body: "Hi {{first_name}} — reaching {{company_name}} here instead of email.",
    condition: "sms_replied",
  },
  {
    match: /\blinkedin connect/i,
    channel: "linkedin",
    action: "connect_linkedin",
    label: "LinkedIn connection",
    condition: "linkedin_connected",
  },
  {
    match: /\blinkedin\b/i,
    channel: "linkedin",
    action: "send_linkedin",
    label: "LinkedIn message",
    body: "Hi {{first_name}} — following up after my note about {{company_name}}.",
    condition: "linkedin_replied",
  },
  {
    match: /\b(phone|call)\b/i,
    channel: "phone",
    action: "make_call",
    label: "Phone call",
    condition: "call_answered",
  },
  {
    match: /\b(twitter|\bx\b)\b/i,
    channel: "x",
    action: "research_x",
    label: "Check Twitter",
  },
  {
    match: /\byoutube\b/i,
    channel: "youtube",
    action: "research_youtube",
    label: "Check YouTube",
  },
  {
    match: /\breddit\b/i,
    channel: "reddit",
    action: "send_reddit",
    label: "Reddit message",
    body: "Hi {{first_name}} — saw {{company_name}} and wanted to start a short thread.",
  },
];

export function isWorkflowEdit(message: string) {
  const value = message.toLowerCase();
  const creating = /\b(create|draft|set up|setup|build|new campaign|start a)\b/.test(value);
  const editing =
    /\b(change|update|edit|adjust|revise|rename|add|remove|delete|insert|make it|set the wait|only send|weekday|constraint|instead|retarget|swap|replace|start with|can we|could we|i want|i wanna)\b/.test(
      value,
    );
  const target = /\b(wait|hour|hours|sms|email|linkedin|whatsapp|workflow|campaign|sequence|step|touch|channel|node)\b/.test(
    value,
  );
  if (creating && !editing) return false;
  return (editing && target) || /\b(wait time|weekday only|hours instead|first touch)\b/.test(value);
}

export function isDestructiveReplacement(current?: WorkflowGraph | null, incoming?: WorkflowGraph | null) {
  if (!current?.nodes?.length || !incoming?.nodes) return false;
  if (incoming.nodes.length === 0) return true;
  const shared = incoming.nodes.filter((node) => current.nodes.some((item) => item.id === node.id)).length;
  return incoming.nodes.length < current.nodes.length - 1 && shared >= 3;
}

export function overlayWorkflow(current: WorkflowGraph, incoming: WorkflowGraph): WorkflowGraph {
  if (isDestructiveReplacement(current, incoming)) return current;
  const previous = new Map(current.nodes.map((node) => [node.id, node]));
  return {
    name: incoming.name || current.name,
    nodes: incoming.nodes.map((node, index) => {
      const prior = previous.get(node.id);
      return {
        ...node,
        type: node.type || "haki",
        position: prior?.position ?? node.position ?? { x: 80, y: 40 + index * 120 },
        data: { ...node.data },
      };
    }),
    edges: incoming.edges ?? current.edges,
  };
}

export function reviseWorkflow(graph: WorkflowGraph, request: string): WorkflowRevision {
  const workflow = cloneGraph(graph);
  const changes: string[] = [];
  const changedNodeIds: string[] = [];
  const mark = (id: string) => {
    if (!changedNodeIds.includes(id)) changedNodeIds.push(id);
  };

  retargetTouches(workflow, request, changes, mark);

  const hours = parseWaitHours(request);
  if (hours != null) {
    const targets = waitNodesAfterAction(workflow, ["send_email", "send_sms", "send_whatsapp"]);
    const nodes = targets.length
      ? workflow.nodes.filter((node) => targets.includes(node.id))
      : workflow.nodes.filter((node) => node.data.type === "wait");
    for (const node of nodes) {
      node.data.waitHours = hours;
      node.data.label = `Wait ${formatHours(hours)}`;
      mark(node.id);
    }
    if (nodes.length) changes.push(`Wait time set to ${formatHours(hours)}`);
  }

  if (/\b(weekday|weekdays|monday|friday|business day|working day)\b/i.test(request)) {
    const emails = workflow.nodes.filter((node) => node.data.action === "send_email" || node.data.channel === "email");
    for (const node of emails) {
      node.data.weekdayOnly = true;
      if (!/weekday/i.test(node.data.label)) {
        node.data.label = `${node.data.label.replace(/\s*\(weekday only\)/i, "")} (weekday only)`;
      }
      if (!node.data.description?.toLowerCase().includes("weekday")) {
        node.data.description = [node.data.description, "Weekday only"].filter(Boolean).join(" · ");
      }
      mark(node.id);
    }
    if (emails.length) changes.push("Emails send on weekdays only");
  }

  const remove = request.match(/\b(?:remove|delete|drop)\b[\s\w-]{0,40}/i);
  if (remove) {
    const spec = TOUCHES.find((item) => item.match.test(remove[0]));
    if (spec) {
      const removed = removeChannel(workflow, spec.channel, spec.action);
      if (removed.length) {
        changes.push(`Removed ${spec.label.toLowerCase()}`);
        changedNodeIds.push(...removed);
      }
    }
  } else if (/\b(add|insert|include|append)\b/i.test(request) && !/\b(instead|as send|change .+ to|start with)\b/i.test(request)) {
    for (const spec of TOUCHES) {
      if (!spec.match.test(request)) continue;
      if (workflow.nodes.some((node) => node.data.action === spec.action || node.data.channel === spec.channel)) {
        continue;
      }
      const created = insertAction(workflow, touchData(spec));
      if (created) {
        changes.push(`Added ${spec.label.toLowerCase()}`);
        mark(created);
      }
    }

    if (/\b(wait|delay|pause)\b/i.test(request) && hours == null) {
      const created = insertAction(workflow, {
        type: "wait",
        label: "Wait 24 hours",
        waitHours: 24,
      });
      if (created) {
        changes.push("Added a 24 hour wait");
        mark(created);
      }
    }
  }

  const rename = request.match(/\b(?:rename|call it|title(?:\s+it)?|named?)\s+["“]?([^"”\n]+)["”]?/i);
  if (rename?.[1]) {
    workflow.name = rename[1].trim();
    changes.push(`Renamed to “${workflow.name}”`);
  }

  return {
    workflow,
    changes,
    changedNodeIds,
    applied: changes.length > 0,
  };
}

export function applyRevisionToProposal(
  current: HermesProposal,
  revision: WorkflowRevision,
): HermesProposal {
  const workflow = { ...revision.workflow, name: revision.workflow.name || current.name };
  const channels = Array.from(
    new Set(
      workflow.nodes
        .map((node) => node.data.channel)
        .filter((channel): channel is ChannelId => Boolean(channel)),
    ),
  );
  return {
    ...current,
    kind: current.kind === "sequence" ? "sequence" : "campaign",
    name: workflow.name || current.name,
    channels: channels.length ? channels : current.channels,
    workflow,
    messages: multiTouchMessages(workflow),
    changes: revision.changes,
    changedNodeIds: revision.changedNodeIds,
    warnings: current.warnings,
  };
}

function retargetTouches(
  workflow: WorkflowGraph,
  request: string,
  changes: string[],
  mark: (id: string) => void,
) {
  const startWith = request.match(/\bstart with(?:\s+an?)?\s+(?:the\s+)?(send\s+)?([a-z]+)/i);
  const swap = request.match(
    /\b(?:edit|change|update|replace|swap|make|use)\b[\s\w-]{0,24}(email|sms|whatsapp|linkedin|phone|call|text)[\s\w-]{0,20}\b(?:as|to|into|instead(?:\s+of)?)\s+(?:send\s+)?(email|sms|whatsapp|linkedin|phone|call|text)/i,
  );
  const instead = request.match(/\b(?:instead of|rather than)\s+(?:send\s+)?(email|sms|whatsapp|linkedin)\b/i);

  const toName =
    swap?.[2] ||
    startWith?.[2] ||
    (!swap && instead ? channelWordAfter(request, ["sms", "whatsapp", "linkedin", "email"]) : null);
  const fromName = swap?.[1] || instead?.[1] || (/\bemail\b/i.test(request) && toName && toName !== "email" ? "email" : null);
  const to = toName ? findTouch(toName) : null;
  const from = fromName ? findTouch(fromName) : null;
  if (!to) return;

  const wantsStart = Boolean(startWith) || /\bstart with\b/i.test(request);
  const target =
    (from ? firstAction(workflow, from) : null) ??
    (wantsStart ? firstAction(workflow) : null) ??
    firstAction(workflow, from ?? undefined);

  if (!target || target.data.channel === to.channel && target.data.action === to.action) {
    if (wantsStart && target?.data.channel === to.channel) {
      changes.push(`First touch is already ${to.label.toLowerCase()}`);
    }
    return;
  }

  applyTouch(target, to);
  mark(target.id);
  const conditionId = retargetDownstreamCondition(workflow, target.id, to.condition);
  if (conditionId) mark(conditionId);
  changes.push(
    wantsStart
      ? `First touch is now ${to.label.toLowerCase()}`
      : `Changed ${from?.label.toLowerCase() || "the step"} to ${to.label.toLowerCase()}`,
  );
}

function channelWordAfter(request: string, names: string[]) {
  const found = names.filter((name) => new RegExp(`\\b${name}\\b`, "i").test(request));
  return found[found.length - 1] ?? null;
}

function findTouch(name: string) {
  return TOUCHES.find((item) => item.match.test(name)) ?? null;
}

function applyTouch(node: WorkflowGraph["nodes"][number], spec: TouchSpec) {
  const prior = node.data;
  node.data = {
    ...prior,
    type: "action",
    action: spec.action,
    channel: spec.channel,
    available: true,
    label: relabel(prior.label, spec.label),
    subject: spec.channel === "email" ? prior.subject || spec.subject : undefined,
    body: prior.body || spec.body,
    description: prior.description && !/email|sms|whatsapp|linkedin/i.test(prior.description)
      ? prior.description
      : spec.description || prior.description,
  };
}

function relabel(current: string, next: string) {
  if (/^send email$/i.test(current) || /^email$/i.test(current) || /initial (email|outreach)/i.test(current)) {
    return next === "Send SMS" ? "Send SMS" : next;
  }
  return current.replace(/email/gi, next.replace(/^Send /i, "")).replace(/send send/gi, "Send");
}

function firstAction(graph: WorkflowGraph, spec?: TouchSpec) {
  if (spec) {
    const match = graph.nodes.find(
      (node) =>
        node.data.type === "action" &&
        (node.data.action === spec.action || node.data.channel === spec.channel),
    );
    if (match) return match;
  }

  const trigger = graph.nodes.find((node) => node.data.type === "trigger");
  let id = trigger
    ? graph.edges.find((edge) => edge.source === trigger.id && !isBranch(edge))?.target
    : graph.nodes.find((node) => node.data.type === "action")?.id;
  const seen = new Set<string>();
  while (id && !seen.has(id)) {
    seen.add(id);
    const node = graph.nodes.find((item) => item.id === id);
    if (node?.data.type === "action") return node;
    id = graph.edges.find((edge) => edge.source === id && !isBranch(edge))?.target;
  }
  return graph.nodes.find((node) => node.data.type === "action");
}

function retargetDownstreamCondition(graph: WorkflowGraph, fromId: string, condition?: ConditionKind) {
  if (!condition) return null;
  const seen = new Set<string>();
  let id: string | undefined = fromId;
  while (id && !seen.has(id)) {
    seen.add(id);
    const next = graph.edges.find((edge) => edge.source === id && !isBranch(edge))?.target;
    if (!next) return null;
    const node = graph.nodes.find((item) => item.id === next);
    if (!node) return null;
    if (node.data.type === "condition") {
      node.data.condition = condition;
      if (/replied|reply|email|sms/i.test(node.data.label)) {
        node.data.label = condition === "sms_replied" ? "SMS replied?" : node.data.label;
      }
      return node.id;
    }
    if (node.data.type === "action" || node.data.type === "end") return null;
    id = next;
  }
  return null;
}

function isBranch(edge: WorkflowGraph["edges"][number]) {
  return edge.sourceHandle === "yes" || edge.label === "yes";
}

function parseWaitHours(request: string) {
  const to = request.match(/\bto\s+(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)?\b/i);
  if (to) return Number(to[1]);
  const wait = request.match(/\bwait(?:\s+time)?(?:\s+(?:of|to|for))?\s+(\d+(?:\.\d+)?)/i);
  if (wait) return Number(wait[1]);
  const hours = request.match(/\b(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)\b/i);
  if (hours) return Number(hours[1]);
  return null;
}

function formatHours(hours: number) {
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

function waitNodesAfterAction(graph: WorkflowGraph, actions: ActionKind[]) {
  const sources = new Set(
    graph.nodes.filter((node) => node.data.action && actions.includes(node.data.action)).map((node) => node.id),
  );
  return graph.edges
    .filter((edge) => sources.has(edge.source))
    .map((edge) => graph.nodes.find((node) => node.id === edge.target))
    .filter((node): node is WorkflowGraph["nodes"][number] => node?.data.type === "wait")
    .map((node) => node.id);
}

function touchData(spec: TouchSpec): WorkflowNodeData {
  return {
    type: "action",
    label: spec.label,
    description: spec.description || "Added from chat",
    action: spec.action,
    channel: spec.channel,
    available: true,
    subject: spec.subject,
    body: spec.body,
  };
}

function insertAction(graph: WorkflowGraph, data: WorkflowNodeData) {
  const end =
    graph.nodes.find((node) => node.data.type === "end" && /complete/i.test(node.data.label)) ??
    [...graph.nodes].reverse().find((node) => node.data.type === "end");
  if (!end) return null;

  const id = nextId(graph);
  const created = {
    id,
    type: "haki",
    position: { x: end.position.x, y: end.position.y },
    data,
  };
  end.position = { x: end.position.x, y: end.position.y + 120 };
  graph.nodes.push(created);

  const incoming = graph.edges.filter((edge) => edge.target === end.id);
  for (const edge of incoming) {
    edge.target = id;
    edge.id = `${edge.source}-${id}${edge.label ? `-${edge.label}` : ""}`;
  }
  graph.edges.push({
    id: `${id}-${end.id}`,
    source: id,
    target: end.id,
  });
  return id;
}

function removeChannel(graph: WorkflowGraph, channel: ChannelId, action: ActionKind) {
  const removed = graph.nodes.filter((node) => node.data.channel === channel || node.data.action === action);
  const ids = new Set(removed.map((node) => node.id));
  if (!ids.size) return [];

  for (const id of ids) {
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

  graph.nodes = graph.nodes.filter((node) => !ids.has(node.id));
  graph.edges = graph.edges.filter((edge) => !ids.has(edge.source) && !ids.has(edge.target));
  return [...ids];
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
