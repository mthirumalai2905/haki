import type { Audience, CampaignGoal, WorkflowGraph } from "../types";

export type HermesRole = "user" | "assistant" | "system";

export type HermesChatMessage = {
  id: string;
  role: HermesRole;
  content: string;
  toolsUsed?: string[];
};

export type HermesProposal = {
  kind: "campaign" | "sequence" | "none";
  campaignId?: string;
  name: string;
  goal?: CampaignGoal;
  goalCustom?: string;
  audience?: Audience;
  channels?: string[];
  workflow?: WorkflowGraph;
  messages?: Array<{
    nodeId: string;
    channel: string;
    subject?: string;
    body: string;
  }>;
  warnings?: string[];
  changes?: string[];
  changedNodeIds?: string[];
};

export type HermesTurn = {
  reply: string;
  proposal?: HermesProposal;
  toolsUsed: string[];
  provider: "deepseek" | "local";
};
