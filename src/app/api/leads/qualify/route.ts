import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/workspace";
import { ai } from "@/lib/ai";
import { recordActivity } from "@/lib/activity";
import { AppError } from "@/lib/errors";
import { jsonError, jsonOk } from "../../_utils";

export async function POST(request: Request) {
  try {
    const workspace = await getWorkspace();
    const body = (await request.json()) as { leadIds?: string[]; icpId?: string };
    const icp = body.icpId
      ? await db.icp.findFirst({ where: { id: body.icpId, workspaceId: workspace.id } })
      : await db.icp.findFirst({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "desc" } });

    const leads = await db.lead.findMany({
      where: {
        workspaceId: workspace.id,
        ...(body.leadIds?.length ? { id: { in: body.leadIds } } : {}),
      },
      include: { company: true },
      take: 200,
    });
    if (leads.length === 0) throw new AppError("NO_LEADS", "No leads available to qualify.");

    const results = [];
    for (const lead of leads) {
      const qualification = await ai.qualifyLead(lead, icp ?? {});
      await db.qualification.create({
        data: {
          leadId: lead.id,
          icpId: icp?.id,
          score: qualification.score,
          status: qualification.status,
          reason: qualification.reason,
        },
      });
      await db.lead.update({
        where: { id: lead.id },
        data: { status: qualification.status },
      });
      await recordActivity({
        workspaceId: workspace.id,
        leadId: lead.id,
        action: "lead_qualified",
        metadata: qualification,
      });
      results.push({ leadId: lead.id, ...qualification });
    }

    return jsonOk({ count: results.length, results });
  } catch (error) {
    return jsonError(error);
  }
}
