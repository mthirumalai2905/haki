import type { ActionKind, ChannelId, WorkflowGraph, WorkflowNodeData } from "../types";
import { summarizeStep, normalizeChannel, type SequenceChannel, type SequenceSpec, type SequenceStepSpec } from "./types";

const ACTION_FOR: Record<SequenceChannel, ActionKind> = {
  email: "send_email",
  linkedin: "send_linkedin",
  sms: "send_sms",
  call_task: "make_call",
  phone: "make_call",
  whatsapp: "send_whatsapp",
  x: "send_x",
};

const GRAPH_CHANNEL: Record<SequenceChannel, ChannelId> = {
  email: "email",
  linkedin: "linkedin",
  sms: "sms",
  call_task: "phone",
  phone: "phone",
  whatsapp: "whatsapp",
  x: "x",
};

export function specToGraph(spec: SequenceSpec): WorkflowGraph {
  const nodes: WorkflowGraph["nodes"] = [];
  const edges: WorkflowGraph["edges"] = [];
  let x = 80;
  const y = 160;

  const triggerId = "seq-trigger";
  nodes.push({
    id: triggerId,
    type: "haki",
    position: { x, y },
    data: { type: "trigger", label: "Lead enters campaign" },
  });
  x += 220;

  let prev = triggerId;
  spec.steps.forEach((step, index) => {
    if (step.delayHours > 0) {
      const waitId = `seq-wait-${index}`;
      nodes.push({
        id: waitId,
        type: "haki",
        position: { x, y },
        data: { type: "wait", label: `Wait ${step.delayHours}h`, waitHours: step.delayHours },
      });
      edges.push({ id: `e-${prev}-${waitId}`, source: prev, target: waitId });
      prev = waitId;
      x += 200;
    }

    const nodeId = step.id || `seq-step-${index}`;
    const data = dataForStep(step);
    nodes.push({
      id: nodeId,
      type: "haki",
      position: { x, y },
      data,
    });
    edges.push({ id: `e-${prev}-${nodeId}`, source: prev, target: nodeId });
    prev = nodeId;
    x += 220;

    if (step.stepType === "action" && step.condition) {
      const condId = `seq-cond-${index}`;
      const endSkip = `seq-end-skip-${index}`;
      nodes.push({
        id: condId,
        type: "haki",
        position: { x, y: y - 40 },
        data: { type: "condition", label: step.condition, condition: step.condition as WorkflowNodeData["condition"] },
      });
      nodes.push({
        id: endSkip,
        type: "haki",
        position: { x, y: y + 120 },
        data: { type: "end", label: "Stop" },
      });
      edges.push({ id: `e-${prev}-${condId}`, source: prev, target: condId });
      edges.push({ id: `e-${condId}-no`, source: condId, target: endSkip, sourceHandle: "no", label: "no" });
      prev = condId;
      x += 220;
    }
  });

  const endId = "seq-end";
  nodes.push({
    id: endId,
    type: "haki",
    position: { x, y },
    data: { type: "end", label: "Stop" },
  });
  edges.push({
    id: `e-${prev}-${endId}`,
    source: prev,
    target: endId,
    sourceHandle: spec.steps.some((step) => step.condition) ? "yes" : undefined,
    label: spec.steps.some((step) => step.condition) ? "yes" : undefined,
  });

  return { name: spec.name || "Sequence", nodes, edges };
}

function dataForStep(step: SequenceStepSpec): WorkflowNodeData {
  if (step.stepType === "wait") {
    return { type: "wait", label: summarizeStep(step), waitHours: step.delayHours || 24 };
  }
  if (step.stepType === "condition") {
    return {
      type: "condition",
      label: step.summary || step.condition || "Condition",
      condition: (step.condition as WorkflowNodeData["condition"]) || "any_engagement",
      sendAfterHour: step.config.sendAfterHour,
      sendBeforeHour: step.config.sendBeforeHour,
    };
  }
  const channel = GRAPH_CHANNEL[step.channel];
  const body = step.config.body || step.config.message || "";
  return {
    type: "action",
    label: summarizeStep(step),
    action: ACTION_FOR[step.channel],
    channel,
    available: true,
    subject: step.config.subject,
    body,
  };
}

export function graphToSpec(graph: WorkflowGraph): SequenceSpec {
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const outgoing = new Map<string, string[]>();
  for (const edge of graph.edges) {
    const list = outgoing.get(edge.source) ?? [];
    list.push(edge.target);
    outgoing.set(edge.source, list);
  }

  const trigger = graph.nodes.find((node) => node.data.type === "trigger") ?? graph.nodes[0];
  const steps: SequenceStepSpec[] = [];
  const seen = new Set<string>();
  let cursor = trigger?.id;
  let pendingDelay = 0;

  while (cursor) {
    const nextIds = outgoing.get(cursor) ?? [];
    const nextId = nextIds[0];
    if (!nextId || seen.has(nextId)) break;
    seen.add(nextId);
    const node = byId.get(nextId);
    if (!node) break;
    if (node.data.type === "wait") {
      pendingDelay = node.data.waitHours ?? 24;
      cursor = nextId;
      continue;
    }
    if (node.data.type === "end") break;
    if (node.data.type === "condition") {
      if (node.data.condition === "is_weekday" || node.data.condition === "in_send_window") {
        steps.push({
          id: node.id,
          channel: "email",
          stepType: "condition",
          delayHours: pendingDelay,
          condition: node.data.condition,
          config: {
            sendAfterHour: node.data.sendAfterHour,
            sendBeforeHour: node.data.sendBeforeHour,
          },
          summary: node.data.label,
        });
        pendingDelay = 0;
      } else if (steps.length) {
        steps[steps.length - 1].condition = node.data.condition || node.data.label;
      }
      cursor = nextId;
      continue;
    }
    if (node.data.type === "action") {
      const channel = normalizeChannel(node.data.channel || "email");
      steps.push({
        id: node.id,
        channel,
        stepType: "action",
        delayHours: pendingDelay,
        config: {
          subject: node.data.subject,
          body: node.data.body,
          message: node.data.channel === "email" ? undefined : node.data.body,
        },
        summary: node.data.label,
      });
      pendingDelay = 0;
    }
    cursor = nextId;
  }

  return { name: graph.name || "Sequence", steps };
}

export function mergeEdited(current: SequenceSpec, incoming: SequenceSpec): SequenceSpec {
  const locked = new Map(
    current.steps.filter((step) => step.editedByUser && step.id).map((step) => [step.id as string, step]),
  );
  return {
    name: incoming.name || current.name,
    goal: incoming.goal ?? current.goal,
    steps: incoming.steps.map((step) => {
      const prior = step.id ? locked.get(step.id) : undefined;
      if (!prior) return step;
      return {
        ...step,
        config: prior.config,
        editedByUser: true,
        videoEnabled: prior.videoEnabled,
      };
    }),
  };
}
