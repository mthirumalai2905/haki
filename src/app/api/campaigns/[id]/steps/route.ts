import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/workspace";
import { AppError } from "@/lib/errors";
import { jsonError, jsonOk } from "../../../_utils";
import { ai } from "@/lib/ai";
import { loadSequence, replaceSteps } from "@/lib/sequence/persist";
import { summarizeStep } from "@/lib/sequence/types";

async function ownedCampaign(id: string) {
  const workspace = await getWorkspace();
  const campaign = await db.campaign.findFirst({ where: { id, workspaceId: workspace.id } });
  if (!campaign) throw new AppError("NOT_FOUND", "Campaign not found.", 404);
  return campaign;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await ownedCampaign(id);
    const loaded = await loadSequence(id);
    const jobs = await db.videoJob.findMany({
      where: { stepId: { in: loaded.spec.steps.map((step) => step.id).filter(Boolean) as string[] } },
      select: { stepId: true, status: true },
    });
    const statusFor = (stepId?: string) => {
      const rows = jobs.filter((job) => job.stepId === stepId);
      if (rows.some((row) => row.status === "failed")) return "failed";
      if (rows.some((row) => row.status === "generating" || row.status === "queued")) return "generating";
      if (rows.some((row) => row.status === "ready")) return "ready";
      return "off";
    };
    return jsonOk({
      versionId: loaded.versionId,
      spec: loaded.spec,
      steps: loaded.spec.steps.map((step, order) => ({
        ...step,
        order,
        summary: summarizeStep(step),
        videoStatus: step.videoEnabled ? statusFor(step.id) : "off",
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const campaign = await ownedCampaign(id);
    const body = await request.json();
    const loaded = await loadSequence(id);
    const spec = await ai.generateSequenceSpec({
      request: String(body.request || body.message || ""),
      goal: campaign.goal,
      channels: undefined,
      current: loaded.spec.steps.length ? loaded.spec : undefined,
    });
    spec.name = campaign.name;
    const steps = await replaceSteps(loaded.versionId, spec);
    return jsonOk({ spec: { ...spec, steps }, steps });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await ownedCampaign(id);
    const body = await request.json();
    const loaded = await loadSequence(id);
    if (!Array.isArray(body.steps)) throw new AppError("INVALID", "steps[] required.", 400);
    const steps = await replaceSteps(loaded.versionId, { name: loaded.spec.name, steps: body.steps });
    return jsonOk({ steps });
  } catch (error) {
    return jsonError(error);
  }
}
