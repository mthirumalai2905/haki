import { completeTools, isDeepSeekConfigured } from "../ai/deepseek";
import { HERMES_TOOLS, runHermesTool } from "./tools";
import { missingDeepSeekTurn } from "./local";
import { checkHakiScope, HAKI_SCOPE, writeHakiReply } from "./scope";
import {
  applyRevisionToProposal,
  isDestructiveReplacement,
  isWorkflowEdit,
  reviseWorkflow,
} from "../workflow/revise";
import { runCampaignGraph, shouldEditCampaignGraph } from "./campaign-graph";
import type { HermesChatMessage, HermesProposal, HermesTurn } from "./types";

const SYSTEM = `You are Hermes, Haki's orchestrator. DeepSeek is your reasoning model.

${HAKI_SCOPE}

If the user is outside Haki or this workspace, refuse in one or two sentences and steer back. Do not answer the off-topic request.

When the user wants a new campaign or sequence:
1. Use get_workspace_context if you need counts or ICP.
2. Call draft_multitouch_campaign for email → wait → follow-up → LinkedIn → Twitter/YouTube research → WhatsApp.
3. Otherwise call draft_campaign or draft_sequence.
4. Use qualify_leads when they ask to score or qualify the list.

When a campaign or sequence already exists on the canvas and the user asks to change it:
Call add_workflow_node, remove_workflow_node, or edit_workflow_node. The campaign is a LangGraph-backed node graph.
Never call draft_campaign, draft_sequence, or draft_multitouch_campaign for an edit.
Keep unspecified nodes and edges. Never replace the whole graph.

Write the reply yourself after tools. Do not use a canned script.`;

export async function runHermes(input: {
  workspaceId: string;
  message: string;
  history: HermesChatMessage[];
  kind: "campaign" | "sequence";
  current?: HermesProposal;
}): Promise<HermesTurn> {
  if (!isDeepSeekConfigured()) {
    return missingDeepSeekTurn();
  }

  const locked =
    shouldEditCampaignGraph(input.message, input.current) || isWorkflowEdit(input.message)
      ? ((await runCampaignGraph(input).catch(() => undefined)) ?? lockWorkflowEdit(input))
      : undefined;
  const editing = Boolean(input.current?.workflow) && isWorkflowEdit(input.message);

  if (!editing && !locked) {
    const scope = await checkHakiScope(input.message, input.history);
    if (!scope.inScope) {
      const refusal =
        scope.refusal ||
        (await writeHakiReply({
          message: input.message,
          notes: "Out of scope. Refuse and steer back to Haki only.",
        }));
      return {
        reply: refusal || "I only help with Haki — this workspace, your leads, and the outreach workflow.",
        proposal: input.current,
        toolsUsed: ["scope_gate"],
        provider: "deepseek",
      };
    }
  }

  try {
    const graph = locked ?? input.current;
    const currentSummary = graph?.workflow
      ? `\n\nCurrent campaign: ${graph.name}\nSteps: ${JSON.stringify(
          graph.workflow.nodes.map((node) => ({
            id: node.id,
            type: node.data.type,
            label: node.data.label,
            waitHours: node.data.waitHours,
            weekdayOnly: node.data.weekdayOnly,
            channel: node.data.channel,
          })),
        )}${locked ? `\nAlready applied to the canvas: ${(locked.changes ?? []).join("; ")}. Describe this. Do not draft a new workflow.` : "\nIf this is an edit, call revise_campaign."}`
      : "";

    const messages: Array<{
      role: "system" | "user" | "assistant" | "tool";
      content?: string | null;
      tool_call_id?: string;
      tool_calls?: unknown;
    }> = [
      ...input.history.slice(-8).map((item) => ({
        role: item.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: item.content,
      })),
      {
        role: "user",
        content: `${input.message}\n\nPreferred artifact: ${input.kind}.${currentSummary}`,
      },
    ];

    let proposal: HermesProposal | undefined = locked;
    const toolsUsed: string[] = locked ? ["revise_campaign"] : [];
    const toolNotes: string[] = [];
    let lastContent = "";

    for (let step = 0; step < 5; step += 1) {
      const turn = await completeTools({
        system: SYSTEM,
        messages,
        tools: HERMES_TOOLS,
      });
      lastContent = turn.content || lastContent;

      if (!turn.toolCalls.length) {
        const recovered = recoverEdit(input, locked ?? proposal, toolsUsed);
        const next = locked ?? recovered.proposal ?? proposal ?? input.current;
        const reply = await finalizeReply(input.message, lastContent, next, toolNotes);
        return {
          reply,
          proposal: next,
          toolsUsed: recovered.toolsUsed,
          provider: "deepseek",
        };
      }

      messages.push(turn.message);
      for (const call of turn.toolCalls) {
        toolsUsed.push(call.function.name);
        const executed = await runHermesTool(
          input.workspaceId,
          call.function.name,
          call.function.arguments,
          { current: input.current },
        );
        if (executed.proposal && !locked) proposal = executed.proposal;
        toolNotes.push(`${call.function.name}: ${JSON.stringify(executed.result).slice(0, 800)}`);
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(executed.result),
        });
      }
    }

    const recovered = recoverEdit(input, locked ?? proposal, toolsUsed);
    const next = locked ?? recovered.proposal ?? proposal ?? input.current;
    return {
      reply: await finalizeReply(input.message, lastContent, next, toolNotes),
      proposal: next,
      toolsUsed: recovered.toolsUsed,
      provider: "deepseek",
    };
  } catch {
    return {
      reply: await writeHakiReply({
        message: input.message,
        notes: "DeepSeek hit an error. Apologize briefly and ask them to try the Haki task again. Do not invent a campaign.",
      }).catch(
        () => "DeepSeek could not finish that turn. Stay in Haki — try the campaign or lead question again.",
      ),
      toolsUsed: [],
      provider: "deepseek",
    };
  }
}

async function finalizeReply(
  message: string,
  modelReply: string,
  proposal: HermesProposal | undefined,
  toolNotes: string[],
) {
  if (modelReply.trim()) return modelReply.trim();
  const notes = [
    proposal
      ? `Workflow “${proposal.name}” has ${proposal.workflow?.nodes.length ?? 0} nodes. Changes: ${(proposal.changes ?? []).join("; ") || "none"}.`
      : "No workflow change.",
    ...toolNotes,
  ].join("\n");
  return writeHakiReply({ message, notes });
}

function lockWorkflowEdit(input: { message: string; current?: HermesProposal }) {
  if (!input.current?.workflow?.nodes.length || !isWorkflowEdit(input.message)) return undefined;
  const revision = reviseWorkflow(input.current.workflow, input.message);
  if (!revision.applied) return undefined;
  return applyRevisionToProposal(input.current, revision);
}

function recoverEdit(
  input: { message: string; current?: HermesProposal },
  proposal: HermesProposal | undefined,
  toolsUsed: string[],
) {
  const current = input.current;
  if (!current?.workflow?.nodes.length) {
    return { proposal, toolsUsed };
  }

  const editing = isWorkflowEdit(input.message);
  if (!editing) return { proposal, toolsUsed };

  const drafted = toolsUsed.some((name) => name.startsWith("draft_"));
  const destructive = isDestructiveReplacement(current.workflow, proposal?.workflow);
  const revision = reviseWorkflow(current.workflow, input.message);
  if (revision.applied) {
    return {
      proposal: applyRevisionToProposal(current, revision),
      toolsUsed: toolsUsed.includes("revise_campaign") ? toolsUsed : [...toolsUsed, "revise_campaign"],
    };
  }
  if (destructive || drafted) {
    return { proposal: current, toolsUsed };
  }

  return { proposal, toolsUsed };
}
