import type { WorkflowGraph } from "../types";

export function defaultWorkflow(): WorkflowGraph {
  return {
    name: "Untitled workflow",
    nodes: [
      {
        id: "n1",
        type: "haki",
        position: { x: 80, y: 40 },
        data: { type: "trigger", label: "Lead enters campaign", description: "Enrollment" },
      },
      {
        id: "n2",
        type: "haki",
        position: { x: 80, y: 170 },
        data: {
          type: "action",
          label: "Send email",
          description: "Initial outreach",
          action: "send_email",
          channel: "email",
          available: true,
          subject: "Quick question about {{company_name}}",
          body: "Hi {{first_name}},\n\nI noticed {{company_name}} is growing in {{industry}}.\n\nWould a short conversation be useful?\n\nBest",
        },
      },
      {
        id: "n3",
        type: "haki",
        position: { x: 80, y: 300 },
        data: { type: "wait", label: "Wait 24 hours", waitHours: 24 },
      },
      {
        id: "n4",
        type: "haki",
        position: { x: 80, y: 430 },
        data: { type: "condition", label: "Has replied?", condition: "email_replied" },
      },
      {
        id: "n5",
        type: "haki",
        position: { x: 320, y: 430 },
        data: { type: "end", label: "Stop", description: "They replied" },
      },
      {
        id: "n6",
        type: "haki",
        position: { x: 80, y: 560 },
        data: {
          type: "action",
          label: "LinkedIn message",
          action: "send_linkedin",
          channel: "linkedin",
          available: true,
          body: "Hi {{first_name}} — following up after my note about {{company_name}}.",
        },
      },
      {
        id: "n7",
        type: "haki",
        position: { x: 80, y: 690 },
        data: { type: "end", label: "Complete" },
      },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3" },
      { id: "e3", source: "n3", target: "n4" },
      { id: "e4", source: "n4", target: "n5", sourceHandle: "yes", label: "yes" },
      { id: "e5", source: "n4", target: "n6", sourceHandle: "no", label: "no" },
      { id: "e6", source: "n6", target: "n7" },
    ],
  };
}

export function actionNodes(graph: WorkflowGraph) {
  return graph.nodes.filter((node) => node.data.type === "action" && node.data.channel);
}
