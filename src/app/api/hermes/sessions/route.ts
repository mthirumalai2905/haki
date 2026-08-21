import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/workspace";
import { jsonError, jsonOk } from "../../_utils";

export async function GET() {
  try {
    const workspace = await getWorkspace();
    const items = await db.hermesThread.findMany({
      where: { workspaceId: workspace.id, kind: "campaign" },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
    });
    return jsonOk({
      items: items.map((item) => ({
        id: item.id,
        title: item.title || "New session",
        updatedAt: item.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST() {
  try {
    const workspace = await getWorkspace();
    const thread = await db.hermesThread.create({
      data: {
        workspaceId: workspace.id,
        kind: "campaign",
        title: "New session",
      },
    });
    return jsonOk({ id: thread.id, title: thread.title }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
