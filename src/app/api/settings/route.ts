import { getWorkspace } from "@/lib/workspace";
import { ai } from "@/lib/ai";
import { db } from "@/lib/db";
import { jsonError, jsonOk } from "../_utils";

export async function GET() {
  try {
    const workspace = await getWorkspace();
    const [leads, campaigns, imports] = await Promise.all([
      db.lead.count({ where: { workspaceId: workspace.id } }),
      db.campaign.count({ where: { workspaceId: workspace.id } }),
      db.import.count({ where: { workspaceId: workspace.id } }),
    ]);
    return jsonOk({
      workspace,
      aiConfigured: ai.configured(),
      counts: { leads, campaigns, imports },
    });
  } catch (error) {
    return jsonError(error);
  }
}
