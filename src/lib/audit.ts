import { db } from "./db";

export async function audit(input: {
  workspaceId: string;
  action: string;
  objectType: string;
  objectId: string;
  metadata?: Record<string, unknown>;
}) {
  return db.auditLog.create({
    data: {
      workspaceId: input.workspaceId,
      action: input.action,
      objectType: input.objectType,
      objectId: input.objectId,
      metadata: JSON.stringify(input.metadata ?? {}),
    },
  });
}
