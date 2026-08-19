import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { completeJson, isDeepSeekConfigured } from "../ai/deepseek";
import { defaultWorkflow } from "../workflow/defaults";
import { applyGraphOps, parseGraphOps, type GraphOp } from "../workflow/ops";
import { applyRevisionToProposal } from "../workflow/revise";
import { HAKI_SCOPE } from "./scope";
import type { HermesProposal } from "./types";
import type { WorkflowGraph } from "../types";

const EditorState = Annotation.Root({
  message: Annotation<string>(),
  name: Annotation<string>(),
  workflow: Annotation<WorkflowGraph>(),
  ops: Annotation<GraphOp[]>({
    reducer: (_current, next) => next,
    default: () => [],
  }),
  changes: Annotation<string[]>({
    reducer: (_current, next) => next,
    default: () => [],
  }),
  changedNodeIds: Annotation<string[]>({
    reducer: (_current, next) => next,
    default: () => [],
  }),
});

async function planNode(state: typeof EditorState.State) {
  let ops = parseGraphOps(state.message);
  if (!ops.length && isDeepSeekConfigured()) {
    try {
      const planned = await completeJson<{ ops: GraphOp[] }>({
        system: `${HAKI_SCOPE}

You plan edits to a Haki campaign graph. Return JSON {"ops":[...]}.
Each op is one of:
- {"kind":"add","nodeType":"action"|"wait"|"condition","channel":"email"|"sms"|"whatsapp"|"linkedin"|"phone"|"x"|"youtube"|"reddit"|"instagram","after":"email|sms|step 2|label","waitHours":12,"label":""}
- {"kind":"remove","step":3,"channel":"youtube","label":""}
- {"kind":"edit","step":2,"channel":"email","patch":{"waitHours":12,"weekdayOnly":true,"channel":"sms","label":""}}
Use the existing node labels and channels. Never drop unspecified nodes. Never launch.`,
        user: JSON.stringify({
          message: state.message,
          steps: state.workflow.nodes.map((node, index) => ({
            step: node.data.type === "trigger" ? 0 : index,
            id: node.id,
            type: node.data.type,
            label: node.data.label,
            channel: node.data.channel,
            waitHours: node.data.waitHours,
          })),
        }),
      });
      if (Array.isArray(planned.ops)) ops = planned.ops;
    } catch {
      ops = [];
    }
  }
  return { ops };
}

function applyNode(state: typeof EditorState.State) {
  const result = applyGraphOps(state.workflow, state.ops);
  return {
    workflow: result.applied ? result.workflow : state.workflow,
    changes: result.changes,
    changedNodeIds: result.changedNodeIds,
  };
}

const editor = new StateGraph(EditorState)
  .addNode("plan", planNode)
  .addNode("apply", applyNode)
  .addEdge(START, "plan")
  .addEdge("plan", "apply")
  .addEdge("apply", END)
  .compile();

export function shouldEditCampaignGraph(message: string, current?: HermesProposal) {
  return Boolean(current?.workflow?.nodes.length) && parseGraphOps(message).length > 0;
}

export async function runCampaignGraph(input: {
  message: string;
  current?: HermesProposal;
}): Promise<HermesProposal | undefined> {
  const base = input.current?.workflow ?? defaultWorkflow();
  const output = await editor.invoke({
    message: input.message,
    name: input.current?.name || base.name,
    workflow: base,
    ops: [],
    changes: [],
    changedNodeIds: [],
  });

  if (!output.changes.length) return undefined;

  return applyRevisionToProposal(
    input.current ?? { kind: "campaign", name: output.name || base.name, workflow: base },
    {
      workflow: { ...output.workflow, name: output.name || base.name },
      changes: output.changes,
      changedNodeIds: output.changedNodeIds,
      applied: true,
    },
  );
}
