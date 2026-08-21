import type { HermesProposal } from "@/lib/hermes/types";

const KEY = "haki:workspace-session";

export type HakiWorkspaceSession = {
  threadId?: string;
  campaignId?: string;
  proposal?: HermesProposal | null;
  showPreview?: boolean;
  tab?: "leads" | "campaign";
};

export function readWorkspaceSession(): HakiWorkspaceSession {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "{}") as HakiWorkspaceSession;
  } catch {
    return {};
  }
}

export function writeWorkspaceSession(session: HakiWorkspaceSession) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(session));
}
