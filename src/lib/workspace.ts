import { db } from "./db";
import { ensureDummyData } from "./sample";

const DEFAULT_WORKSPACE_NAME = "Haki";

export async function getWorkspace() {
  const existing = await db.workspace.findFirst({
    orderBy: { createdAt: "asc" },
  });
  const workspace = existing ?? (await db.workspace.create({
    data: { name: DEFAULT_WORKSPACE_NAME },
  }));
  await ensureDummyData(workspace.id);
  return workspace;
}

export async function assertWorkspaceAccess(workspaceId: string) {
  const workspace = await getWorkspace();
  if (workspace.id !== workspaceId) {
    throw new Error("Workspace not found");
  }
  return workspace;
}
