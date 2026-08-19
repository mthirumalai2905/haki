import type {
  IcpDefinition,
  QualificationResult,
  WorkflowGraph,
  WorkflowNodeData,
} from "../types";

type LeadLike = {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  jobTitle?: string | null;
  email?: string | null;
  industry?: string | null;
  country?: string | null;
  companySize?: string | null;
  company?: { name?: string | null; industry?: string | null; companySize?: string | null } | null;
};

function includesLoose(value?: string | null, target?: string | null) {
  if (!value || !target) return false;
  return value.toLowerCase().includes(target.toLowerCase()) ||
    target.toLowerCase().includes(value.toLowerCase());
}

export function fallbackQualify(lead: LeadLike, icp: IcpDefinition): QualificationResult {
  let score = 40;
  const reasons: string[] = [];

  const industry = lead.industry || lead.company?.industry;
  const size = lead.companySize || lead.company?.companySize;
  const company = lead.company?.name;

  if (icp.industry && includesLoose(industry, icp.industry)) {
    score += 20;
    reasons.push(`industry matches ${icp.industry}`);
  } else if (icp.industry && industry) {
    score -= 8;
    reasons.push("industry is outside the ICP");
  }

  if (icp.companySize && includesLoose(size, icp.companySize)) {
    score += 15;
    reasons.push("company size is in range");
  }

  if (icp.location && includesLoose(lead.country, icp.location)) {
    score += 10;
    reasons.push(`location matches ${icp.location}`);
  }

  if (icp.jobTitle && includesLoose(lead.jobTitle, icp.jobTitle)) {
    score += 15;
    reasons.push(`title aligns with ${icp.jobTitle}`);
  }

  if (lead.email) score += 4;
  score = Math.max(0, Math.min(99, score));

  const status = score >= 75 ? "qualified" : score >= 55 ? "maybe" : "unqualified";
  const name = lead.fullName || [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "this contact";
  const reason =
    reasons.length > 0
      ? `${status === "qualified" ? "Strong" : status === "maybe" ? "Partial" : "Weak"} ICP match for ${name}${company ? ` at ${company}` : ""} because ${reasons.join(", ")}.`
      : `Limited ICP signal for ${name}. Score reflects available profile data only.`;

  return { score, status, reason };
}

export function fallbackWorkflow(input: {
  request: string;
  goal?: string;
  channels?: string[];
}): WorkflowGraph {
  const text = `${input.request} ${input.goal ?? ""}`.toLowerCase();
  const wantsLinkedin = text.includes("linkedin") || (input.channels ?? []).includes("linkedin");
  const wantsSms = text.includes("sms") || (input.channels ?? []).includes("sms");
  const wantsCall = text.includes("call") || text.includes("phone");

  const nodes: WorkflowGraph["nodes"] = [
    node("n1", { x: 80, y: 40 }, {
      type: "trigger",
      label: "Lead enters campaign",
      description: "Enrollment",
    }),
    node("n2", { x: 80, y: 160 }, {
      type: "action",
      label: "AI qualification",
      description: "Score against ICP",
      action: "qualify",
    }),
    node("n3", { x: 80, y: 280 }, {
      type: "action",
      label: "Send email",
      description: "Initial outreach",
      action: "send_email",
      channel: "email",
      available: true,
      subject: "Quick question about {{company_name}}",
      body: "Hi {{first_name}},\n\nI noticed {{company_name}} is growing in {{industry}}. I wanted to share a concise idea that may help your team.\n\nWould it be useful to talk for 15 minutes?\n\nBest",
    }),
    node("n4", { x: 80, y: 400 }, {
      type: "wait",
      label: "Wait 24 hours",
      description: "Give space to reply",
      waitHours: 24,
    }),
    node("n5", { x: 80, y: 520 }, {
      type: "condition",
      label: "Has replied?",
      description: "Email replied",
      condition: "email_replied",
    }),
    node("n6", { x: 320, y: 520 }, {
      type: "end",
      label: "Stop",
      description: "Positive path",
    }),
  ];

  const edges: WorkflowGraph["edges"] = [
    edge("n1", "n2"),
    edge("n2", "n3"),
    edge("n3", "n4"),
    edge("n4", "n5"),
    edge("n5", "n6", "yes"),
  ];

  let previous = "n5";
  let y = 640;

  if (wantsLinkedin) {
    nodes.push(node("n7", { x: 80, y }, {
      type: "action",
      label: "LinkedIn message",
      description: "Follow up",
      action: "send_linkedin",
      channel: "linkedin",
      available: true,
      body: "Hi {{first_name}} — following up here after my note about {{company_name}}.",
    }));
    edges.push(edge(previous, "n7", "no"));
    previous = "n7";
    y += 120;
    nodes.push(node("n8", { x: 80, y }, {
      type: "wait",
      label: "Wait 48 hours",
      waitHours: 48,
    }));
    edges.push(edge(previous, "n8"));
    previous = "n8";
    y += 120;
  }

  if (wantsSms) {
    nodes.push(node("n9", { x: 80, y }, {
      type: "action",
      label: "Send SMS",
      description: "Short follow-up",
      action: "send_sms",
      channel: "sms",
      available: true,
      body: "Hi {{first_name}}, circling back on my note for {{company_name}}. Open to a quick chat?",
    }));
    edges.push(edge(previous, "n9", previous === "n5" ? "no" : undefined));
    previous = "n9";
    y += 120;
  } else if (!wantsLinkedin) {
    nodes.push(node("n9", { x: 80, y }, {
      type: "action",
      label: "Follow-up email",
      action: "send_email",
      channel: "email",
      available: true,
      subject: "Re: {{company_name}}",
      body: "Hi {{first_name}}, just bumping this in case it was buried.",
    }));
    edges.push(edge(previous, "n9", "no"));
    previous = "n9";
    y += 120;
  }

  if (wantsCall) {
    nodes.push(node("n10", { x: 80, y }, {
      type: "action",
      label: "Phone call",
      action: "make_call",
      channel: "phone",
      available: true,
    }));
    edges.push(edge(previous, "n10"));
    previous = "n10";
    y += 120;
  }

  nodes.push(node("n11", { x: 80, y }, {
    type: "end",
    label: "Complete",
    description: "Sequence finished",
  }));
  edges.push(edge(previous, "n11"));

  return {
    name: "Generated outreach workflow",
    nodes,
    edges,
  };
}

export function fallbackMessage(input: {
  channel: string;
  goal?: string;
  tone?: string;
}) {
  const tone = input.tone || "direct";
  const goal = input.goal || "start a conversation";
  if (input.channel === "sms" || input.channel === "whatsapp") {
    return {
      subject: null as string | null,
      body: `Hi {{first_name}}, quick note on {{company_name}} — would a short conversation help you ${goal.toLowerCase()}?`,
    };
  }
  if (input.channel === "linkedin") {
    return {
      subject: null,
      body: `Hi {{first_name}}, I work with teams like {{company_name}} in {{industry}}. Happy to share a concise idea if useful.`,
    };
  }
  return {
    subject: `Idea for {{company_name}}`,
    body: `Hi {{first_name}},\n\nI noticed {{company_name}} is growing in {{industry}}. I wanted to reach out with a ${tone} note about how teams like yours ${goal.toLowerCase()}.\n\nWould you be open to a short conversation?\n\nBest`,
  };
}

export function fallbackRewrite(body: string, instruction: string) {
  const lower = instruction.toLowerCase();
  if (lower.includes("short")) {
    return body.split("\n").filter(Boolean).slice(0, 3).join("\n");
  }
  if (lower.includes("personal")) {
    return `${body}\n\nI looked specifically at {{company_name}} before writing this.`;
  }
  if (lower.includes("direct")) {
    return body.replace("Would you be open to a short conversation?", "Can we book 15 minutes this week?");
  }
  return body;
}

export function fallbackClassify(text: string) {
  const value = text.toLowerCase();
  if (/(unsubscribe|remove me|stop)/.test(value)) return "unsubscribe";
  if (/(out of office|ooo|on leave)/.test(value)) return "out_of_office";
  if (/(let's talk|book|calendar|meeting|call)/.test(value)) return "meeting_request";
  if (/(not interested|no thanks|don't contact)/.test(value)) return "negative";
  if (/(interested|sounds good|tell me more|yes)/.test(value)) return "positive";
  if (/\?/.test(value)) return "question";
  return "neutral";
}

export function fallbackSummary(lead: LeadLike) {
  const name = lead.fullName || [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "This contact";
  const company = lead.company?.name;
  const title = lead.jobTitle;
  return `${name}${title ? `, ${title}` : ""}${company ? ` at ${company}` : ""} is available for multi-channel outreach. Profile completeness is ${lead.email ? "strong on email" : "limited on email"}.`;
}

export function fallbackNextAction(lead: LeadLike) {
  if (lead.email) return { action: "send_email", reason: "Email is the strongest available channel." };
  if (lead.jobTitle) return { action: "send_linkedin", reason: "No email on file; LinkedIn is the next best path." };
  return { action: "review", reason: "Contact details are thin. Review the record before outreach." };
}

function node(
  id: string,
  position: { x: number; y: number },
  data: WorkflowNodeData,
): WorkflowGraph["nodes"][number] {
  return { id, type: "haki", position, data };
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
