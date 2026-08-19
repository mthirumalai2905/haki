import type { WorkflowGraph } from "../types";

export const DUMMY_CAMPAIGN_NAME = "Multi-touch fried shop outreach";

export function multiTouchWorkflow(): WorkflowGraph {
  return {
    name: DUMMY_CAMPAIGN_NAME,
    nodes: [
      node("n1", 80, 40, {
        type: "trigger",
        label: "Lead enters campaign",
        description: "Dummy enrollment",
      }),
      node("n2", 80, 160, {
        type: "action",
        label: "Send email",
        description: "First touch",
        action: "send_email",
        channel: "email",
        available: true,
        subject: "Quick note for {{company_name}}",
        body: "Hi {{first_name}},\n\nI work with independent fried shops and noticed {{company_name}}. Would a short conversation about weekend volume be useful?\n\n— Haki (simulated)",
      }),
      node("n3", 80, 280, {
        type: "wait",
        label: "Wait 24 hours",
        waitHours: 24,
      }),
      node("n4", 80, 400, {
        type: "condition",
        label: "Any engagement?",
        condition: "any_engagement",
      }),
      node("n5", 340, 400, {
        type: "end",
        label: "Stop",
        description: "They replied",
      }),
      node("n6", 80, 520, {
        type: "action",
        label: "Follow-up email",
        description: "No engagement",
        action: "send_email",
        channel: "email",
        available: true,
        subject: "Re: {{company_name}}",
        body: "Hi {{first_name}}, circling back in case the first note was buried. Happy to keep this short.\n\n— Haki (simulated)",
      }),
      node("n7", 80, 640, {
        type: "wait",
        label: "Wait 24 hours",
        waitHours: 24,
      }),
      node("n8", 80, 760, {
        type: "condition",
        label: "Replied yet?",
        condition: "no_response",
      }),
      node("n9", 340, 760, {
        type: "end",
        label: "Stop",
        description: "They replied to the follow-up",
      }),
      node("n10", 80, 880, {
        type: "action",
        label: "LinkedIn connection",
        description: "Still no reply",
        action: "connect_linkedin",
        channel: "linkedin",
        available: true,
        body: "Hi {{first_name}} — connecting after my note about {{company_name}}.",
      }),
      node("n11", 80, 1000, {
        type: "action",
        label: "Check Twitter",
        description: "Gather public context",
        action: "research_x",
        channel: "x",
        available: true,
      }),
      node("n12", 80, 1120, {
        type: "action",
        label: "Check YouTube",
        description: "New sapien / intel",
        action: "research_youtube",
        channel: "youtube",
        available: true,
      }),
      node("n13", 80, 1240, {
        type: "action",
        label: "WhatsApp",
        description: "Personalized from intel",
        action: "send_whatsapp",
        channel: "whatsapp",
        available: true,
        body: "Hi {{first_name}} — saw {{company_name}} on YouTube ({{youtube_sapien}}) and the latest Twitter note ({{twitter_sapien}}). Wanted to send a short WhatsApp instead of another email.",
      }),
      node("n14", 80, 1360, {
        type: "end",
        label: "Complete",
      }),
    ],
    edges: [
      edge("n1", "n2"),
      edge("n2", "n3"),
      edge("n3", "n4"),
      edge("n4", "n5", "yes"),
      edge("n4", "n6", "no"),
      edge("n6", "n7"),
      edge("n7", "n8"),
      edge("n8", "n10", "yes"),
      edge("n8", "n9", "no"),
      edge("n10", "n11"),
      edge("n11", "n12"),
      edge("n12", "n13"),
      edge("n13", "n14"),
    ],
  };
}

export function multiTouchMessages(graph: WorkflowGraph) {
  return graph.nodes
    .filter((node) => node.data.body || node.data.subject)
    .map((node) => ({
      nodeId: node.id,
      channel: node.data.channel || "email",
      subject: node.data.subject,
      body: node.data.body || "",
    }));
}

function node(
  id: string,
  x: number,
  y: number,
  data: WorkflowGraph["nodes"][number]["data"],
): WorkflowGraph["nodes"][number] {
  return { id, type: "haki", position: { x, y }, data };
}

function edge(source: string, target: string, label?: string): WorkflowGraph["edges"][number] {
  return {
    id: `${source}-${target}${label ? `-${label}` : ""}`,
    source,
    target,
    sourceHandle: label,
    label,
  };
}
