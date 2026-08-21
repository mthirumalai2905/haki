import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/workspace";
import { AppError } from "@/lib/errors";
import { jsonError, jsonOk } from "../../../../_utils";
import { loadSequence, replaceSteps } from "@/lib/sequence/persist";
import { enqueueVideoJobs, setStepVideoEnabled } from "@/lib/video/jobs";
import { parseJson } from "@/lib/utils";

async function ownedStep(campaignId: string, stepId: string) {
  const workspace = await getWorkspace();
  const campaign = await db.campaign.findFirst({ where: { id: campaignId, workspaceId: workspace.id } });
  if (!campaign) throw new AppError("NOT_FOUND", "Campaign not found.", 404);
  const step = await db.workflowStep.findFirst({
    where: { id: stepId, workflowVersion: { campaignId } },
  });
  if (!step) throw new AppError("NOT_FOUND", "Step not found.", 404);
  return { campaign, step };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  try {
    const { id, stepId } = await params;
    const { campaign, step } = await ownedStep(id, stepId);
    const body = await request.json();
    const config = body.config ? { ...parseJson(step.config, {}), ...body.config } : parseJson(step.config, {});
    const editedByUser =
      body.editedByUser === true || Boolean(body.config?.subject || body.config?.body || body.config?.message);

    const updated = await db.workflowStep.update({
      where: { id: step.id },
      data: {
        channel: body.channel ?? step.channel,
        delayHours: typeof body.delayHours === "number" ? body.delayHours : step.delayHours,
        condition: body.condition === undefined ? step.condition : body.condition,
        config: JSON.stringify(config),
        editedByUser: editedByUser || step.editedByUser,
        videoEnabled: typeof body.videoEnabled === "boolean" ? body.videoEnabled : step.videoEnabled,
      },
    });

    if (typeof body.videoEnabled === "boolean") {
      await setStepVideoEnabled(step.id, body.videoEnabled);
      if (body.videoEnabled && updated.channel === "email") {
        const leads = await db.campaignLead.findMany({ where: { campaignId: campaign.id }, select: { leadId: true } });
        const ids = leads.map((item) => item.leadId);
        if (!ids.length) {
          const audience = await db.lead.findMany({
            where: { workspaceId: campaign.workspaceId, optedOut: false },
            take: 25,
            select: { id: true },
          });
          await enqueueVideoJobs(step.id, audience.map((item) => item.id));
        } else {
          await enqueueVideoJobs(step.id, ids);
        }
      }
    }

    const loaded = await loadSequence(id);
    await replaceSteps(loaded.versionId, loaded.spec);
    return jsonOk(updated);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  try {
    const { id, stepId } = await params;
    await ownedStep(id, stepId);
    const loaded = await loadSequence(id);
    const steps = loaded.spec.steps.filter((step) => step.id !== stepId);
    await replaceSteps(loaded.versionId, { ...loaded.spec, steps });
    return jsonOk({ deleted: stepId });
  } catch (error) {
    return jsonError(error);
  }
}
