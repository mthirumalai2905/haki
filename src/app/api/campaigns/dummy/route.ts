import { getWorkspace } from "@/lib/workspace";
import { setupDummyMultitouchCampaign } from "@/lib/campaigns/dummy";
import { jsonError, jsonOk } from "../../_utils";

export async function POST(request: Request) {
  try {
    const workspace = await getWorkspace();
    const body = await request.json().catch(() => ({ launch: true }));
    const result = await setupDummyMultitouchCampaign(workspace.id, body.launch !== false);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
