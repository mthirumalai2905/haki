import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/workspace";
import { runHermes } from "@/lib/hermes/orchestrator";
import { parseJson } from "@/lib/utils";
import { AppError } from "@/lib/errors";
import { jsonError, jsonOk } from "../../_utils";
import { proposalFromCampaign, syncProposalToCampaign } from "@/lib/campaigns/sync";
import { isWorkflowEdit } from "@/lib/workflow/revise";
import type { HermesChatMessage, HermesProposal } from "@/lib/hermes/types";

export async function POST(request: Request) {
  try {
    const workspace = await getWorkspace();
    const body = await request.json();
    const kind = body.kind === "sequence" ? "sequence" : "campaign";
    const message = String(body.message ?? "").trim();
    if (!message) {
      throw new AppError("EMPTY_MESSAGE", "Say what you want Hermes to build.");
    }

    let thread = body.threadId
      ? await db.hermesThread.findFirst({
          where: { id: body.threadId, workspaceId: workspace.id },
        })
      : null;

    if (!thread) {
      thread = await db.hermesThread.create({
        data: {
          workspaceId: workspace.id,
          kind,
          title: message.slice(0, 48),
        },
      });
    }

    const history = parseJson<HermesChatMessage[]>(thread.messages, []);
    const stored = parseJson<HermesProposal>(thread.proposal, { kind: "none", name: "" });
    const incoming = isProposal(body.current) ? (body.current as HermesProposal) : undefined;
    let current = incoming?.workflow ? incoming : stored.workflow ? stored : undefined;

    if (!current?.workflow && body.campaignId && isWorkflowEdit(message)) {
      const existing = await db.campaign.findFirst({
        where: { id: String(body.campaignId), workspaceId: workspace.id },
        include: { workflowVersions: { where: { isActive: true }, take: 1 } },
      });
      current = existing ? proposalFromCampaign(existing) ?? current : current;
    }

    const turn = await runHermes({
      workspaceId: workspace.id,
      message,
      history,
      kind,
      current,
    });

    const proposal = turn.proposal ?? current;
    let campaignId = String(body.campaignId || proposal?.campaignId || current?.campaignId || "");

    if (
      turn.proposal?.workflow &&
      kind === "campaign" &&
      turn.proposal.kind !== "none" &&
      turn.proposal.kind !== "sequence"
    ) {
      const synced = await syncProposalToCampaign(workspace.id, turn.proposal, campaignId || undefined);
      if (synced) {
        campaignId = synced.campaignId;
        turn.proposal.campaignId = synced.campaignId;
        if (proposal) proposal.campaignId = synced.campaignId;
      }
    }

    const nextMessages: HermesChatMessage[] = [
      ...history,
      { id: `u-${Date.now()}`, role: "user", content: message },
      {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: turn.reply,
        toolsUsed: turn.toolsUsed,
      },
    ];

    const updated = await db.hermesThread.update({
      where: { id: thread.id },
      data: {
        kind,
        messages: JSON.stringify(nextMessages),
        proposal: JSON.stringify(proposal ?? {}),
        title: proposal?.name || thread.title,
      },
    });

    return jsonOk({
      threadId: updated.id,
      reply: turn.reply,
      proposal,
      campaignId: campaignId || undefined,
      toolsUsed: turn.toolsUsed,
      provider: turn.provider,
      messages: nextMessages,
    });
  } catch (error) {
    return jsonError(error);
  }
}

function isProposal(value: unknown): value is HermesProposal {
  if (!value || typeof value !== "object") return false;
  const item = value as HermesProposal;
  return Boolean(item.workflow?.nodes);
}
