import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/workspace";
import { parseImportFile } from "@/lib/import/parse";
import { AppError } from "@/lib/errors";
import { jsonError, jsonOk } from "../_utils";
import { serializeImport } from "@/lib/import/serialize";

export const runtime = "nodejs";

export async function GET() {
  try {
    const workspace = await getWorkspace();
    const items = await db.import.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return jsonOk(items);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const workspace = await getWorkspace();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new AppError("NO_FILE", "Drop a CSV or XLSX file to continue.");
    }

    const ext = path.extname(file.name).toLowerCase();
    if (![".csv", ".xlsx", ".xls", ".json"].includes(ext)) {
      throw new AppError("INVALID_TYPE", "Upload a CSV, XLSX, or JSON file.");
    }
    if (file.size > 20 * 1024 * 1024) {
      throw new AppError("FILE_TOO_LARGE", "Files larger than 20MB are not supported yet.");
    }

    const uploads = path.join(process.cwd(), "uploads");
    await mkdir(uploads, { recursive: true });
    const storedName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(uploads, storedName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const created = await db.import.create({
      data: {
        workspaceId: workspace.id,
        fileName: file.name,
        fileType: file.type || ext,
        fileSize: file.size,
        filePath,
        status: "processing",
      },
    });

    try {
      const parsed = await parseImportFile(filePath, created.fileType);
      const updated = await db.import.update({
        where: { id: created.id },
        data: {
          status: "preview_ready",
          rowCount: parsed.rows.length,
          columnCount: parsed.headers.length,
          headers: JSON.stringify(parsed.headers),
          mappings: JSON.stringify(parsed.mappings),
          preview: JSON.stringify(parsed.preview),
          stats: JSON.stringify(parsed.stats),
        },
      });
      return jsonOk(serializeImport(updated));
    } catch {
      await db.import.update({
        where: { id: created.id },
        data: {
          status: "failed",
          error: "The uploaded file could not be processed.",
        },
      });
      throw new AppError("IMPORT_FAILED", "The uploaded file could not be processed.");
    }
  } catch (error) {
    return jsonError(error);
  }
}
