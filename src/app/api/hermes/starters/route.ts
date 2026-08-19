import { getWorkspace } from "@/lib/workspace";
import { completeJson, isDeepSeekConfigured } from "@/lib/ai/deepseek";
import { workspaceContext } from "@/lib/hermes/tools";
import { HAKI_SCOPE } from "@/lib/hermes/scope";
import { jsonError, jsonOk } from "../../_utils";

export type HermesStarter = {
  title: string;
  body: string;
  hint: string;
};

export async function GET(request: Request) {
  try {
    const workspace = await getWorkspace();
    const kind = new URL(request.url).searchParams.get("kind") === "sequence" ? "sequence" : "campaign";

    if (!isDeepSeekConfigured()) {
      return jsonOk({ starters: [] as HermesStarter[], provider: "none" });
    }

    const context = await workspaceContext(workspace.id);
    const result = await completeJson<{ starters: HermesStarter[] }>({
      system: `${HAKI_SCOPE}

Propose 4 short chat starters for this Haki workspace. They must stay inside Haki: preview ingested leads, qualify, draft or edit a ${kind}, or review a simulated workflow.
Return JSON {"starters":[{"title":"","body":"","hint":""}]}
title <= 22 chars. body is the full prompt the user will send. hint <= 42 chars.`,
      user: JSON.stringify({ kind, context }),
    });

    const starters = (result.starters ?? [])
      .filter((item) => item.title && item.body)
      .slice(0, 4);

    return jsonOk({ starters, provider: "deepseek" });
  } catch (error) {
    return jsonError(error);
  }
}
