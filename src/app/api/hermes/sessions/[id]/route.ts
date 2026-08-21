import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/workspace";
import { AppError } from "@/lib/errors";
import { jsonError, jsonOk } from "../../../_utils";

async function ownedThread(id: string) {
  const workspace = await getWorkspace();
  const thread = await db.hermesThread.findFirst({
    where: { id, workspaceId: workspace.id },
  });
  if (!thread) throw new AppError("NOT_FOUND", "That session is gone.", 404);
  return thread;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const thread = await ownedThread(id);
    const body = await request.json();
    const title = String(body.title ?? "").trim().slice(0, 80);
    if (!title) throw new AppError("EMPTY_TITLE", "Give the session a name.");

    const updated = await db.hermesThread.update({
      where: { id: thread.id },
      data: { title },
    });
    return jsonOk({ id: updated.id, title: updated.title });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const thread = await ownedThread(id);
    await db.hermesThread.delete({ where: { id: thread.id } });
    return jsonOk({ id: thread.id });
  } catch (error) {
    return jsonError(error);
  }
}
