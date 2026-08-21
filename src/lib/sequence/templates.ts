import type { WorkflowGraph, WorkflowNodeData } from "../types";

export type SequenceTemplate = {
  id: string;
  name: string;
  blurb: string;
  how: string;
  workflow: WorkflowGraph;
};

export function templateChannels(workflow: WorkflowGraph) {
  return Array.from(
    new Set(
      workflow.nodes
        .map((node) => node.data.channel)
        .filter((channel): channel is NonNullable<typeof channel> => Boolean(channel)),
    ),
  );
}

export function templateSteps(workflow: WorkflowGraph) {
  return [...workflow.nodes].sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
}

export function getSequenceTemplate(id: string) {
  return SEQUENCE_TEMPLATES.find((item) => item.id === id) ?? null;
}

export function cloneWorkflow(workflow: WorkflowGraph): WorkflowGraph {
  return {
    ...workflow,
    nodes: workflow.nodes.map((node) => ({ ...node, data: { ...node.data } })),
    edges: workflow.edges.map((edge) => ({ ...edge })),
  };
}

function node(id: string, x: number, y: number, data: WorkflowNodeData) {
  return { id, type: "haki", position: { x, y }, data };
}

function edge(source: string, target: string, handle?: "yes" | "no") {
  return {
    id: `${source}-${target}${handle ? `-${handle}` : ""}`,
    source,
    target,
    sourceHandle: handle,
    label: handle,
  };
}

export const SEQUENCE_TEMPLATES: SequenceTemplate[] = [
  {
    id: "first-reply",
    name: "First reply",
    blurb: "One email. Wait a day. Stop if they answer.",
    how: "Trigger starts the path. Email is the first touch. Wait 24 hours. If they replied, stop. If not, send a short follow-up and end.",
    workflow: {
      name: "First reply",
      nodes: [
        node("t1", 80, 40, { type: "trigger", label: "Lead enters" }),
        node("t2", 80, 170, {
          type: "action",
          label: "Send email",
          action: "send_email",
          channel: "email",
          available: true,
          subject: "Quick note for {{company_name}}",
          body: "Hi {{first_name}},\n\nI wanted to reach {{company_name}}.\n\n",
        }),
        node("t3", 80, 300, { type: "wait", label: "Wait 24 hours", waitHours: 24 }),
        node("t4", 80, 430, { type: "condition", label: "Has replied?", condition: "email_replied" }),
        node("t5", 320, 430, { type: "end", label: "Stop. They replied." }),
        node("t6", 80, 560, {
          type: "action",
          label: "Follow-up email",
          action: "send_email",
          channel: "email",
          available: true,
          subject: "Following up",
          body: "Hi {{first_name}},\n\nCircling back on {{company_name}}.\n\n",
        }),
        node("t7", 80, 690, { type: "end", label: "Complete" }),
      ],
      edges: [
        edge("t1", "t2"),
        edge("t2", "t3"),
        edge("t3", "t4"),
        edge("t4", "t5", "yes"),
        edge("t4", "t6", "no"),
        edge("t6", "t7"),
      ],
    },
  },
  {
    id: "weekday-window",
    name: "Weekday window",
    blurb: "No weekends. Only 9 to 10.",
    how: "A weekday check sits first. Saturday and Sunday wait. A time window then holds until 9 a.m. Email only fires inside that window.",
    workflow: {
      name: "Weekday window",
      nodes: [
        node("w1", 80, 40, { type: "trigger", label: "Lead enters" }),
        node("w2", 80, 170, { type: "condition", label: "Weekday check", condition: "is_weekday" }),
        node("w3", 320, 170, { type: "wait", label: "Wait for weekday", waitHours: 24 }),
        node("w4", 80, 300, {
          type: "condition",
          label: "Time window 9:00-10:00",
          condition: "in_send_window",
          sendAfterHour: 9,
          sendBeforeHour: 10,
        }),
        node("w5", 320, 300, { type: "wait", label: "Wait for the window", waitHours: 1 }),
        node("w6", 80, 430, {
          type: "action",
          label: "Send email",
          action: "send_email",
          channel: "email",
          available: true,
          weekdayOnly: true,
          subject: "Morning note for {{company_name}}",
          body: "Hi {{first_name}},\n\n",
        }),
        node("w7", 80, 560, { type: "end", label: "Complete" }),
      ],
      edges: [
        edge("w1", "w2"),
        edge("w2", "w4", "yes"),
        edge("w2", "w3", "no"),
        edge("w3", "w2"),
        edge("w4", "w6", "yes"),
        edge("w4", "w5", "no"),
        edge("w5", "w4"),
        edge("w6", "w7"),
      ],
    },
  },
  {
    id: "multi-channel",
    name: "Email then LinkedIn",
    blurb: "Email first. LinkedIn if they stay quiet.",
    how: "Same lead, two channels. Email goes out. Wait a day. If there is no reply, the path continues to LinkedIn. A reply stops the sequence.",
    workflow: {
      name: "Email then LinkedIn",
      nodes: [
        node("m1", 80, 40, { type: "trigger", label: "Lead enters" }),
        node("m2", 80, 170, {
          type: "action",
          label: "Send email",
          action: "send_email",
          channel: "email",
          available: true,
          subject: "Intro for {{company_name}}",
          body: "Hi {{first_name}},\n\n",
        }),
        node("m3", 80, 300, { type: "wait", label: "Wait 24 hours", waitHours: 24 }),
        node("m4", 80, 430, { type: "condition", label: "Has replied?", condition: "email_replied" }),
        node("m5", 320, 430, { type: "end", label: "Stop. They replied." }),
        node("m6", 80, 560, {
          type: "action",
          label: "LinkedIn message",
          action: "send_linkedin",
          channel: "linkedin",
          available: true,
          body: "Hi {{first_name}}, following up from my note to {{company_name}}.",
        }),
        node("m7", 80, 690, { type: "end", label: "Complete" }),
      ],
      edges: [
        edge("m1", "m2"),
        edge("m2", "m3"),
        edge("m3", "m4"),
        edge("m4", "m5", "yes"),
        edge("m4", "m6", "no"),
        edge("m6", "m7"),
      ],
    },
  },
  {
    id: "three-touch",
    name: "Three-touch",
    blurb: "Email. Follow-up. Then LinkedIn.",
    how: "Three touches, two waits. Reply at any email step stops the path. Silence moves to the next channel.",
    workflow: {
      name: "Three-touch",
      nodes: [
        node("x1", 80, 40, { type: "trigger", label: "Lead enters" }),
        node("x2", 80, 170, {
          type: "action",
          label: "First email",
          action: "send_email",
          channel: "email",
          available: true,
          subject: "Quick question for {{company_name}}",
          body: "Hi {{first_name}},\n\n",
        }),
        node("x3", 80, 300, { type: "wait", label: "Wait 48 hours", waitHours: 48 }),
        node("x4", 80, 430, { type: "condition", label: "Has replied?", condition: "email_replied" }),
        node("x5", 320, 430, { type: "end", label: "Stop. They replied." }),
        node("x6", 80, 560, {
          type: "action",
          label: "Follow-up email",
          action: "send_email",
          channel: "email",
          available: true,
          subject: "Still useful for {{company_name}}?",
          body: "Hi {{first_name}},\n\n",
        }),
        node("x7", 80, 690, { type: "wait", label: "Wait 72 hours", waitHours: 72 }),
        node("x8", 80, 820, {
          type: "action",
          label: "LinkedIn message",
          action: "send_linkedin",
          channel: "linkedin",
          available: true,
          body: "Hi {{first_name}}, I sent two notes to {{company_name}}. Happy to keep this short.",
        }),
        node("x9", 80, 950, { type: "end", label: "Complete" }),
      ],
      edges: [
        edge("x1", "x2"),
        edge("x2", "x3"),
        edge("x3", "x4"),
        edge("x4", "x5", "yes"),
        edge("x4", "x6", "no"),
        edge("x6", "x7"),
        edge("x7", "x8"),
        edge("x8", "x9"),
      ],
    },
  },
  {
    id: "whatsapp-close",
    name: "Email then WhatsApp",
    blurb: "Email first. WhatsApp if they stay quiet.",
    how: "Email goes out. Wait two days. If there is no reply, WhatsApp is the second channel. A reply stops the sequence.",
    workflow: {
      name: "Email then WhatsApp",
      nodes: [
        node("p1", 80, 40, { type: "trigger", label: "Lead enters" }),
        node("p2", 80, 170, {
          type: "action",
          label: "Send email",
          action: "send_email",
          channel: "email",
          available: true,
          subject: "Note for {{company_name}}",
          body: "Hi {{first_name}},\n\n",
        }),
        node("p3", 80, 300, { type: "wait", label: "Wait 48 hours", waitHours: 48 }),
        node("p4", 80, 430, { type: "condition", label: "Has replied?", condition: "email_replied" }),
        node("p5", 320, 430, { type: "end", label: "Stop. They replied." }),
        node("p6", 80, 560, {
          type: "action",
          label: "WhatsApp",
          action: "send_whatsapp",
          channel: "whatsapp",
          available: true,
          body: "Hi {{first_name}}, following up from my email to {{company_name}}.",
        }),
        node("p7", 80, 690, { type: "end", label: "Complete" }),
      ],
      edges: [
        edge("p1", "p2"),
        edge("p2", "p3"),
        edge("p3", "p4"),
        edge("p4", "p5", "yes"),
        edge("p4", "p6", "no"),
        edge("p6", "p7"),
      ],
    },
  },
];
