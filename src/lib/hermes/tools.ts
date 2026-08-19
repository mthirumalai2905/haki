import { db } from "../db";
import { ai } from "../ai";
import { fallbackWorkflow } from "../ai/fallback";
import { actionNodes, defaultWorkflow } from "../workflow/defaults";
import { DUMMY_CAMPAIGN_NAME, multiTouchMessages, multiTouchWorkflow } from "../workflow/multitouch";
import { applyGraphOps, parseGraphOps } from "../workflow/ops";
import { applyRevisionToProposal, reviseWorkflow } from "../workflow/revise";
import type { DeepSeekTool } from "../ai/deepseek";
import type { CampaignGoal, ChannelId, WorkflowGraph } from "../types";
import type { HermesProposal } from "./types";

export const HERMES_TOOLS: DeepSeekTool[] = [
  {
    type: "function",
    function: {
      name: "get_workspace_context",
      description: "Read current workspace counts, ICP, industries, and available channels.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "draft_campaign",
      description:
        "Draft a multi-channel campaign with a workflow and messages. Never launch it. Use after you understand the user's goal.",
      parameters: {
        type: "object",
        properties: {
          request: { type: "string" },
          name: { type: "string" },
          goal: {
            type: "string",
            enum: [
              "book_meetings",
              "generate_replies",
              "start_conversations",
              "drive_website_visits",
              "generate_leads",
              "custom",
            ],
          },
          audienceType: { type: "string", enum: ["all", "qualified", "filtered"] },
          channels: { type: "array", items: { type: "string" } },
        },
        required: ["request"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "draft_multitouch_campaign",
      description:
        "Draft the dummy multi-touch campaign: email, wait 24h, follow-up if no engagement, LinkedIn connect if still no reply, research Twitter, research YouTube for new sapien, then a personalized WhatsApp. Simulation only. Never launch.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "draft_sequence",
      description: "Draft a reusable sequence/workflow without attaching it to a live campaign.",
      parameters: {
        type: "object",
        properties: {
          request: { type: "string" },
          name: { type: "string" },
          channels: { type: "array", items: { type: "string" } },
        },
        required: ["request"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "revise_campaign",
      description:
        "Edit the current campaign workflow. Use this whenever the user changes wait times, weekday constraints, adds or removes steps, or otherwise updates an existing draft. Never only describe the change — call this so the Campaign preview updates.",
      parameters: {
        type: "object",
        properties: {
          request: { type: "string", description: "The user's edit in their own words." },
          waitHours: { type: "number", description: "New wait duration in hours, if they asked to change it." },
          weekdayOnly: {
            type: "boolean",
            description: "True when emails should send on weekdays only.",
          },
          name: { type: "string" },
        },
        required: ["request"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_workflow_node",
      description:
        "Add a node to the current campaign graph. Use after, before, or step to place it. Does not replace the graph.",
      parameters: {
        type: "object",
        properties: {
          channel: { type: "string" },
          nodeType: { type: "string", enum: ["action", "wait", "condition"] },
          after: { type: "string" },
          before: { type: "string" },
          waitHours: { type: "number" },
          label: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_workflow_node",
      description: "Remove a node from the current campaign graph by step, channel, or label. Rewires edges.",
      parameters: {
        type: "object",
        properties: {
          step: { type: "number" },
          channel: { type: "string" },
          label: { type: "string" },
          nodeId: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "edit_workflow_node",
      description: "Edit an existing node: wait hours, channel, weekday, label, or copy.",
      parameters: {
        type: "object",
        properties: {
          step: { type: "number" },
          channel: { type: "string" },
          label: { type: "string" },
          nodeId: { type: "string" },
          waitHours: { type: "number" },
          weekdayOnly: { type: "boolean" },
          nextChannel: { type: "string" },
          newLabel: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "qualify_leads",
      description:
        "Score workspace leads against the current ICP with DeepSeek. Use when the user asks to qualify, score, or match the list.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number" },
          requireWhatsapp: { type: "boolean" },
          requireYoutube: { type: "boolean" },
        },
      },
    },
  },
];

export type HermesToolContext = {
  current?: HermesProposal;
};

export async function runHermesTool(
  workspaceId: string,
  name: string,
  rawArgs: string,
  context: HermesToolContext = {},
): Promise<{ result: unknown; proposal?: HermesProposal }> {
  const args = safeParse(rawArgs);
  if (name === "get_workspace_context") {
    return { result: await workspaceContext(workspaceId) };
  }
  if (name === "draft_campaign") {
    const proposal = await draftCampaign(workspaceId, args);
    return { result: summarizeProposal(proposal), proposal };
  }
  if (name === "draft_multitouch_campaign") {
    const proposal = await draftMultitouchCampaign(workspaceId, args);
    return { result: summarizeProposal(proposal), proposal };
  }
  if (name === "draft_sequence") {
    const proposal = await draftSequence(args);
    return { result: summarizeProposal(proposal), proposal };
  }
  if (name === "revise_campaign") {
    const proposal = await reviseCampaign(workspaceId, args, context.current);
    return { result: summarizeProposal(proposal), proposal };
  }
  if (name === "qualify_leads") {
    return { result: await qualifyLeads(workspaceId, args) };
  }
  if (name === "add_workflow_node" || name === "remove_workflow_node" || name === "edit_workflow_node") {
    const proposal = mutateGraph(name, args, context.current);
    return { result: summarizeProposal(proposal), proposal };
  }
  return { result: { error: "Unknown tool" } };
}

export async function workspaceContext(workspaceId: string) {
  const [leadCount, qualified, industries, icp] = await Promise.all([
    db.lead.count({ where: { workspaceId } }),
    db.lead.count({ where: { workspaceId, status: "qualified" } }),
    db.lead.groupBy({
      by: ["industry"],
      where: { workspaceId, industry: { not: null } },
      _count: { _all: true },
    }),
    db.icp.findFirst({ where: { workspaceId }, orderBy: { createdAt: "desc" } }),
  ]);

  return {
    leadCount,
    qualified,
    industries: industries.map((row) => ({ industry: row.industry, count: row._count._all })),
    icp,
    simulation: true,
    availableChannels: ["email", "sms", "whatsapp", "linkedin", "instagram", "x", "youtube", "phone"],
    note: "Outreach is simulated. No email, LinkedIn, Twitter, YouTube, or WhatsApp providers. Hermes never launches automatically.",
    dummyMultitouch:
      "email → wait 24h → follow-up if no engagement → LinkedIn connect if no reply → research X → research YouTube (sapien) → personalized WhatsApp",
  };
}

export async function draftCampaign(
  workspaceId: string,
  args: Record<string, unknown>,
): Promise<HermesProposal> {
  const request = String(args.request ?? "");
  const goal = (args.goal as CampaignGoal) || inferGoal(request);
  const channels = normalizeChannels(args.channels) ?? inferChannels(request);
  const audienceType = (args.audienceType as "all" | "qualified" | "filtered") || "all";
  const count =
    audienceType === "qualified"
      ? await db.lead.count({ where: { workspaceId, status: "qualified" } })
      : await db.lead.count({ where: { workspaceId } });

  if (isMultitouchRequest(request)) {
    return draftMultitouchCampaign(workspaceId, args);
  }

  const workflow = await safeWorkflow({
    request,
    goal,
    channels,
    audience: audienceType,
  });
  const messages = await messagesFor(workflow, goal);

  return {
    kind: "campaign",
    name: String(args.name || workflow.name || "Untitled campaign"),
    goal,
    audience: { type: audienceType, count },
    channels,
    workflow,
    messages,
    warnings: [
      "Hermes drafted this. Review the canvas before saving.",
      "Launch stays in simulation mode.",
    ],
  };
}

export async function draftMultitouchCampaign(
  workspaceId: string,
  args: Record<string, unknown> = {},
): Promise<HermesProposal> {
  const count = await db.lead.count({ where: { workspaceId } });
  const workflow = multiTouchWorkflow();
  return {
    kind: "campaign",
    name: String(args.name || DUMMY_CAMPAIGN_NAME),
    goal: "start_conversations",
    audience: { type: "all", count },
    channels: ["email", "linkedin", "x", "youtube", "whatsapp"],
    workflow,
    messages: multiTouchMessages(workflow),
    warnings: [
      "Dummy multi-touch path. No email provider or social APIs.",
      "Twitter and YouTube steps produce simulated sapien, then personalize WhatsApp.",
      "Hermes drafted this. Review the canvas. Nothing launches until you say so.",
    ],
  };
}

export async function draftSequence(args: Record<string, unknown>): Promise<HermesProposal> {
  const request = String(args.request ?? "");
  const channels = normalizeChannels(args.channels) ?? inferChannels(request);
  const workflow = await safeWorkflow({ request, channels });
  const messages = await messagesFor(workflow, "start_conversations");
  return {
    kind: "sequence",
    name: String(args.name || workflow.name || "Untitled sequence"),
    channels,
    workflow,
    messages,
    warnings: ["Reusable sequence. Attach it to a campaign after you review the canvas."],
  };
}

async function safeWorkflow(input: {
  request: string;
  goal?: string;
  channels?: string[];
  audience?: string;
}): Promise<WorkflowGraph> {
  try {
    return await ai.generateWorkflow(input);
  } catch {
    return fallbackWorkflow(input);
  }
}

async function messagesFor(workflow: WorkflowGraph, goal: string) {
  const nodes = actionNodes(workflow);
  const messages = [];
  for (const node of nodes) {
    const channel = node.data.channel || "email";
    if (node.data.body) {
      messages.push({
        nodeId: node.id,
        channel,
        subject: node.data.subject,
        body: node.data.body,
      });
      continue;
    }
    const generated = await ai.generateMessage({ channel, goal });
    messages.push({
      nodeId: node.id,
      channel,
      subject: generated.subject ?? undefined,
      body: generated.body,
    });
  }
  return messages;
}

function inferGoal(text: string): CampaignGoal {
  const value = text.toLowerCase();
  if (value.includes("meeting") || value.includes("call")) return "book_meetings";
  if (value.includes("reply")) return "generate_replies";
  if (value.includes("visit") || value.includes("website")) return "drive_website_visits";
  return "start_conversations";
}

function isMultitouchRequest(request: string) {
  const value = request.toLowerCase();
  return (
    value.includes("multi-touch") ||
    value.includes("multitouch") ||
    value.includes("dummy campaign") ||
    (value.includes("linkedin") &&
      value.includes("whatsapp") &&
      (value.includes("youtube") || value.includes("twitter") || value.includes(" sapien")))
  );
}

function inferChannels(text: string) {
  const value = text.toLowerCase();
  const channels = ["email"];
  if (value.includes("whatsapp")) channels.push("whatsapp");
  if (value.includes("instagram") || value.includes("ig")) channels.push("instagram");
  if (value.includes("linkedin")) channels.push("linkedin");
  if (value.includes("sms") || value.includes("text")) channels.push("sms");
  if (value.includes("tiktok")) channels.push("instagram");
  if (channels.length === 1) channels.push("whatsapp", "instagram");
  return channels;
}

function normalizeChannels(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  const channels = value.map((item) => String(item).toLowerCase()).filter(Boolean);
  return channels.length ? channels : undefined;
}

export async function reviseCampaign(
  workspaceId: string,
  args: Record<string, unknown>,
  current?: HermesProposal,
): Promise<HermesProposal> {
  const request = String(args.request ?? "");
  const base = current?.workflow
    ? current
    : await draftMultitouchCampaign(workspaceId, { name: args.name || current?.name });

  const structured = [request];
  if (typeof args.waitHours === "number") structured.push(`change wait time to ${args.waitHours} hours`);
  if (args.weekdayOnly === true) structured.push("only send emails on weekdays");
  const ops = parseGraphOps(structured.join(". "));
  if (ops.length && base.workflow) {
    const operated = applyGraphOps(base.workflow, ops);
    if (operated.applied) {
      const next = applyRevisionToProposal(base, operated);
      if (typeof args.name === "string" && args.name.trim()) {
        next.name = args.name.trim();
        if (next.workflow) next.workflow.name = next.name;
      }
      return next;
    }
  }

  const revision = reviseWorkflow(base.workflow ?? multiTouchWorkflow(), structured.join(". "));
  const next = applyRevisionToProposal(
    base,
    revision.applied
      ? revision
      : {
          ...revision,
          workflow: base.workflow ?? multiTouchWorkflow(),
          changes: revision.changes.length ? revision.changes : ["Kept the current workflow"],
          applied: true,
        },
  );
  if (typeof args.name === "string" && args.name.trim()) {
    next.name = args.name.trim();
    if (next.workflow) next.workflow.name = next.name;
  }
  return next;
}

async function qualifyLeads(workspaceId: string, args: Record<string, unknown>) {
  const limit = Math.min(12, Math.max(3, Number(args.limit) || 8));
  const icp = await db.icp.findFirst({ where: { workspaceId }, orderBy: { createdAt: "desc" } });
  const leads = await db.lead.findMany({
    where: {
      workspaceId,
      ...(args.requireWhatsapp === true ? { whatsapp: { not: null } } : {}),
      ...(args.requireYoutube === true ? { youtube: { not: null } } : {}),
    },
    include: { company: true },
    take: limit,
    orderBy: { updatedAt: "desc" },
  });

  const results = [];
  for (const lead of leads) {
    const result = await ai.qualifyLead(lead, icp ?? {});
    results.push({
      id: lead.id,
      company: lead.company?.name,
      name: lead.fullName || [lead.firstName, lead.lastName].filter(Boolean).join(" "),
      score: result.score,
      status: result.status,
      reason: result.reason,
    });
  }

  return {
    count: results.length,
    qualified: results.filter((item) => item.status === "qualified").length,
    icp: icp
      ? { industry: icp.industry, companySize: icp.companySize, location: icp.location, jobTitle: icp.jobTitle }
      : null,
    leads: results,
    note: "Qualification is a recommendation. Review before using it as an audience.",
  };
}

function mutateGraph(
  name: string,
  args: Record<string, unknown>,
  current?: HermesProposal,
): HermesProposal {
  const base = current?.workflow
    ? current
    : { kind: "campaign" as const, name: "Untitled campaign", workflow: defaultWorkflow() };
  const channel = asChannel(args.channel);
  const result = applyGraphOps(base.workflow ?? defaultWorkflow(), [
    name === "add_workflow_node"
      ? {
          kind: "add" as const,
          channel,
          nodeType: args.nodeType === "wait" || args.nodeType === "condition" ? args.nodeType : "action",
          after: stringArg(args.after),
          before: stringArg(args.before),
          waitHours: typeof args.waitHours === "number" ? args.waitHours : undefined,
          label: stringArg(args.label),
        }
      : name === "remove_workflow_node"
        ? {
            kind: "remove" as const,
            nodeId: stringArg(args.nodeId),
            step: typeof args.step === "number" ? args.step : undefined,
            channel,
            label: stringArg(args.label),
          }
        : {
            kind: "edit" as const,
            nodeId: stringArg(args.nodeId),
            step: typeof args.step === "number" ? args.step : undefined,
            channel,
            label: stringArg(args.label),
            patch: {
              waitHours: typeof args.waitHours === "number" ? args.waitHours : undefined,
              weekdayOnly: typeof args.weekdayOnly === "boolean" ? args.weekdayOnly : undefined,
              channel: asChannel(args.nextChannel),
              label: stringArg(args.newLabel),
            },
          },
  ]);
  return applyRevisionToProposal(base, result);
}

function asChannel(value: unknown): ChannelId | undefined {
  const allowed: ChannelId[] = ["email", "sms", "phone", "linkedin", "whatsapp", "x", "reddit", "instagram", "youtube"];
  return allowed.includes(value as ChannelId) ? (value as ChannelId) : undefined;
}

function stringArg(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || undefined;
}

function summarizeProposal(proposal: HermesProposal) {
  return {
    kind: proposal.kind,
    name: proposal.name,
    goal: proposal.goal,
    channels: proposal.channels,
    steps: proposal.workflow?.nodes.length ?? 0,
    messages: proposal.messages?.length ?? 0,
    changes: proposal.changes ?? [],
    waits: (proposal.workflow?.nodes ?? [])
      .filter((node) => node.data.type === "wait")
      .map((node) => node.data.label),
  };
}

function safeParse(value: string) {
  try {
    return JSON.parse(value || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}
