import { getWorkspace } from "@/lib/workspace";
import { describeTouchpoints, runTouchpoint, TOUCHPOINT_ACTIONS } from "@/lib/touchpoints/run";
import { AppError } from "@/lib/errors";
import { jsonError, jsonOk } from "../../_utils";

const ALIASES: Record<string, string> = {
  email: "send_email",
  followup: "follow_up_email",
  "follow-up": "follow_up_email",
  linkedin: "connect_linkedin",
  x: "research_x",
  twitter: "research_x",
  youtube: "research_youtube",
  whatsapp: "send_whatsapp",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ action: string }> },
) {
  const { action } = await context.params;
  return jsonOk({
    ...describeTouchpoints(),
    action: resolveAction(action),
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ action: string }> },
) {
  try {
    const workspace = await getWorkspace();
    const { action } = await context.params;
    const body = await request.json().catch(() => ({}));
    return jsonOk(
      await runTouchpoint({
        workspaceId: workspace.id,
        action: resolveAction(action),
        leadId: body.leadId,
        campaignId: body.campaignId,
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}

function resolveAction(value: string) {
  const resolved = ALIASES[value] || value;
  if (!TOUCHPOINT_ACTIONS.includes(resolved as (typeof TOUCHPOINT_ACTIONS)[number])) {
    throw new AppError("UNKNOWN_TOUCHPOINT", "Unknown touchpoint action.");
  }
  return resolved;
}
