import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/workspace";
import { computeImportStats } from "@/lib/import/validate";
import { parseJson } from "@/lib/utils";
import { AppError } from "@/lib/errors";
import { jsonError, jsonOk } from "../../../_utils";
import { serializeImport } from "@/lib/import/serialize";
import type { FieldMapping } from "@/lib/types";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const workspace = await getWorkspace();
    const { id } = await params;
    const body = (await request.json()) as { mappings: FieldMapping[] };
    const item = await db.import.findFirst({
      where: { id, workspaceId: workspace.id },
    });
    if (!item) throw new AppError("NOT_FOUND", "Import not found.", 404);

    const preview = parseJson<Record<string, string>[]>(item.preview, []);
    const stats = computeImportStats(preview, body.mappings ?? []);

    const updated = await db.import.update({
      where: { id },
      data: {
        mappings: JSON.stringify(body.mappings ?? []),
        stats: JSON.stringify({ ...stats, rows: item.rowCount, columns: item.columnCount }),
        status: "mapping",
      },
    });

    return jsonOk(serializeImport(updated));
  } catch (error) {
    return jsonError(error);
  }
}
