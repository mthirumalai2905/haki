import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/workspace";
import { parseJson } from "@/lib/utils";
import { jsonError, jsonOk } from "../_utils";

export async function GET() {
  try {
    const workspace = await getWorkspace();
    const items = await db.workflow.findMany({
      where: { workspaceId: workspace.id },
      include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
    });
    return jsonOk(
      items.map((workflow) => ({
        ...workflow,
        latest: workflow.versions[0]
          ? {
              ...workflow.versions[0],
              nodes: parseJson(workflow.versions[0].nodes, []),
              edges: parseJson(workflow.versions[0].edges, []),
            }
          : null,
      })),
    );
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const workspace = await getWorkspace();
    const body = await request.json();
    const workflow = await db.workflow.create({
      data: {
        workspaceId: workspace.id,
        name: body.name || "Untitled sequence",
        description: body.description,
        versions: {
          create: {
            version: 1,
            nodes: JSON.stringify(body.nodes ?? []),
            edges: JSON.stringify(body.edges ?? []),
            isActive: true,
          },
        },
      },
    });
    return jsonOk(workflow, 201);
  } catch (error) {
    return jsonError(error);
  }
}
