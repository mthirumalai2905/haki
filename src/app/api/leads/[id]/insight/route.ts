import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/workspace";
import { ai } from "@/lib/ai";
import { AppError } from "@/lib/errors";
import { jsonError, jsonOk } from "../../../_utils";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const workspace = await getWorkspace();
    const { id } = await params;
    const lead = await db.lead.findFirst({
      where: { id, workspaceId: workspace.id },
      include: { company: true },
    });
    if (!lead) throw new AppError("NOT_FOUND", "Lead not found.", 404);

    const [summary, next] = await Promise.all([
      ai.summarizeLead(lead),
      ai.recommendNextAction(lead),
    ]);

    return jsonOk({
      aiSummary: summary.summary,
      nextAction: next,
    });
  } catch (error) {
    return jsonError(error);
  }
}
