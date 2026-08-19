import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/workspace";
import { listActivities } from "@/lib/activity";
import { parseJson } from "@/lib/utils";
import { AppError } from "@/lib/errors";
import { jsonError, jsonOk } from "../../_utils";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const workspace = await getWorkspace();
    const { id } = await params;
    const lead = await db.lead.findFirst({
      where: { id, workspaceId: workspace.id },
      include: {
        company: true,
        qualifications: { orderBy: { createdAt: "desc" }, take: 3 },
        campaignLeads: {
          include: { campaign: { select: { id: true, name: true, status: true } } },
        },
      },
    });
    if (!lead) throw new AppError("NOT_FOUND", "Lead not found.", 404);

    const activities = await listActivities({
      workspaceId: workspace.id,
      leadId: lead.id,
      limit: 30,
    });

    return jsonOk({
      ...lead,
      customFields: parseJson(lead.customFields, {}),
      activities,
    });
  } catch (error) {
    return jsonError(error);
  }
}
