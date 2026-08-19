import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/workspace";
import { AppError } from "@/lib/errors";
import { jsonError, jsonOk } from "../../_utils";
import { serializeImport } from "@/lib/import/serialize";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const workspace = await getWorkspace();
    const { id } = await params;
    const item = await db.import.findFirst({
      where: { id, workspaceId: workspace.id },
    });
    if (!item) throw new AppError("NOT_FOUND", "Import not found.", 404);
    return jsonOk(serializeImport(item));
  } catch (error) {
    return jsonError(error);
  }
}
