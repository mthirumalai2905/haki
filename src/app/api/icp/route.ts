import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/workspace";
import { jsonError, jsonOk } from "../_utils";

export async function GET() {
  try {
    const workspace = await getWorkspace();
    const items = await db.icp.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk(items);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const workspace = await getWorkspace();
    const body = await request.json();
    const existing = await db.icp.findFirst({ where: { workspaceId: workspace.id } });
    const item = existing
      ? await db.icp.update({
          where: { id: existing.id },
          data: {
            name: body.name ?? existing.name,
            industry: body.industry,
            companySize: body.companySize,
            location: body.location,
            jobTitle: body.jobTitle,
            description: body.description,
          },
        })
      : await db.icp.create({
          data: {
            workspaceId: workspace.id,
            name: body.name || "Default ICP",
            industry: body.industry,
            companySize: body.companySize,
            location: body.location,
            jobTitle: body.jobTitle,
            description: body.description,
          },
        });
    return jsonOk(item);
  } catch (error) {
    return jsonError(error);
  }
}
