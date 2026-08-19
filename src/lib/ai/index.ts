import type { IcpDefinition, QualificationResult, WorkflowGraph } from "../types";
import { completeJson, isDeepSeekConfigured } from "./deepseek";
import {
  fallbackClassify,
  fallbackMessage,
  fallbackNextAction,
  fallbackQualify,
  fallbackRewrite,
  fallbackSummary,
  fallbackWorkflow,
} from "./fallback";

type LeadContext = {
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

function validateQualification(value: QualificationResult): QualificationResult {
  const score = Math.max(0, Math.min(100, Number(value.score) || 0));
  const status =
    value.status === "qualified" || value.status === "maybe" || value.status === "unqualified"
      ? value.status
      : score >= 75
        ? "qualified"
        : score >= 55
          ? "maybe"
          : "unqualified";
  return {
    score,
    status,
    reason: value.reason || "Qualification completed.",
  };
}

function validateWorkflow(value: WorkflowGraph): WorkflowGraph {
  if (!value?.nodes?.length || !value.edges) {
    throw new Error("Invalid workflow");
  }
  return {
    name: value.name || "Generated workflow",
    nodes: value.nodes,
    edges: value.edges,
  };
}

export const ai = {
  configured: isDeepSeekConfigured,

  async qualifyLead(lead: LeadContext, icp: IcpDefinition): Promise<QualificationResult> {
    if (!isDeepSeekConfigured()) {
      return fallbackQualify(lead, icp);
    }

    try {
      const result = await completeJson<QualificationResult>({
        system:
          "You qualify B2B leads against an ICP. Return {score:0-100,status:'qualified'|'maybe'|'unqualified',reason:string}.",
        user: JSON.stringify({ lead, icp }),
      });
      return validateQualification(result);
    } catch {
      return fallbackQualify(lead, icp);
    }
  },

  async generateWorkflow(input: {
    request: string;
    goal?: string;
    channels?: string[];
    audience?: string;
  }): Promise<WorkflowGraph> {
    if (!isDeepSeekConfigured()) {
      return fallbackWorkflow(input);
    }

    try {
      const result = await completeJson<WorkflowGraph>({
        system:
          "You generate multi-channel outreach workflows for Haki. Return {name,nodes,edges}. Nodes use type haki and data {label,description,type:'trigger'|'action'|'condition'|'wait'|'ai_decision'|'end',action,channel,condition,waitHours,weekdayOnly,subject,body,available}. Never launch a campaign. Keep nodes compact. Always include a trigger and at least one end node. Use yes/no sourceHandle on condition edges. When revising an existing workflow, preserve unspecified steps and apply weekdayOnly/waitHours when requested.",
        user: JSON.stringify(input),
      });
      return validateWorkflow(result);
    } catch {
      return fallbackWorkflow(input);
    }
  },

  async generateMessage(input: {
    lead?: LeadContext;
    company?: string;
    goal?: string;
    channel: string;
    tone?: string;
    customFields?: Record<string, string>;
  }) {
    if (!isDeepSeekConfigured()) {
      return fallbackMessage(input);
    }
    try {
      return await completeJson<{ subject: string | null; body: string }>({
        system:
          "Write a concise outreach message. Use {{first_name}}, {{company_name}}, {{industry}}, {{job_title}} variables. Return {subject,body}. Subject may be null for non-email channels.",
        user: JSON.stringify(input),
      });
    } catch {
      return fallbackMessage(input);
    }
  },

  async rewriteMessage(body: string, instruction: string) {
    if (!isDeepSeekConfigured()) {
      return { body: fallbackRewrite(body, instruction) };
    }
    try {
      return await completeJson<{ body: string }>({
        system: "Rewrite the outreach message. Keep personalization variables. Return {body}.",
        user: JSON.stringify({ body, instruction }),
      });
    } catch {
      return { body: fallbackRewrite(body, instruction) };
    }
  },

  async classifyReply(text: string) {
    if (!isDeepSeekConfigured()) {
      return { category: fallbackClassify(text) };
    }
    try {
      const result = await completeJson<{ category: string }>({
        system:
          "Classify an outreach reply as one of: positive, negative, neutral, question, meeting_request, unsubscribe, out_of_office. Return {category}.",
        user: text,
      });
      return result;
    } catch {
      return { category: fallbackClassify(text) };
    }
  },

  async summarizeLead(lead: LeadContext) {
    if (!isDeepSeekConfigured()) {
      return { summary: fallbackSummary(lead) };
    }
    try {
      return await completeJson<{ summary: string }>({
        system: "Summarize this lead for an outreach operator in 2 sentences. Return {summary}.",
        user: JSON.stringify(lead),
      });
    } catch {
      return { summary: fallbackSummary(lead) };
    }
  },

  async recommendNextAction(lead: LeadContext) {
    if (!isDeepSeekConfigured()) {
      return fallbackNextAction(lead);
    }
    try {
      return await completeJson<{ action: string; reason: string }>({
        system:
          "Recommend the next outreach action. Return {action,reason}. Action should be send_email, send_linkedin, send_sms, make_call, or review.",
        user: JSON.stringify(lead),
      });
    } catch {
      return fallbackNextAction(lead);
    }
  },
};
