import { getWorkspace } from "@/lib/workspace";
import { seedSampleData } from "@/lib/sample";
import { jsonError, jsonOk } from "../_utils";

export async function POST(request: Request) {
  try {
    const workspace = await getWorkspace();
    const body = await request.json().catch(() => ({ force: true }));
    const result = await seedSampleData(workspace.id, body.force !== false);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
