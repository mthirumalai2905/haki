import { getWorkspace } from "@/lib/workspace";
import { describeTouchpoints, runTouchpoint } from "@/lib/touchpoints/run";
import { jsonError, jsonOk } from "../_utils";

export async function GET() {
  return jsonOk(describeTouchpoints());
}

export async function POST(request: Request) {
  try {
    const workspace = await getWorkspace();
    const body = await request.json();
    return jsonOk(
      await runTouchpoint({
        workspaceId: workspace.id,
        action: String(body.action ?? ""),
        leadId: body.leadId,
        campaignId: body.campaignId,
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}
