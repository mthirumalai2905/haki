import { getWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { jsonError, jsonOk } from "../../../../../_utils";
import { loadSequence, replaceSteps } from "@/lib/sequence/persist";

export async function POST(_: Request, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  try {
    const workspace = await getWorkspace();
    const { id, stepId } = await params;
    const campaign = await db.campaign.findFirst({ where: { id, workspaceId: workspace.id } });
    if (!campaign) throw new AppError("NOT_FOUND", "Campaign not found.", 404);
    const loaded = await loadSequence(id);
    const index = loaded.spec.steps.findIndex((step) => step.id === stepId);
    if (index < 0) throw new AppError("NOT_FOUND", "Step not found.", 404);
    const copy = { ...loaded.spec.steps[index], id: undefined, editedByUser: false };
    const steps = [...loaded.spec.steps];
    steps.splice(index + 1, 0, copy);
    const written = await replaceSteps(loaded.versionId, { ...loaded.spec, steps });
    return jsonOk({ steps: written });
  } catch (error) {
    return jsonError(error);
  }
}
