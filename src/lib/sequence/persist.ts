import { db } from "../db";
import { parseJson } from "../utils";
import { specToGraph, graphToSpec } from "./compile";
import { summarizeStep, normalizeChannel, type SequenceSpec, type SequenceStepSpec, type SequenceStepView } from "./types";

export function rowToSpec(rows: Array<{
  id: string;
  order: number;
  channel: string;
  stepType: string;
  config: string;
  delayHours: number;
  condition: string | null;
  editedByUser: boolean;
  videoEnabled: boolean;
}>): SequenceSpec {
  return {
    name: "Sequence",
    steps: rows
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((row) => ({
        id: row.id,
        channel: normalizeChannel(row.channel),
        stepType: (row.stepType as SequenceStepSpec["stepType"]) || "action",
        delayHours: row.delayHours,
        condition: row.condition,
        config: parseJson(row.config, {}),
        editedByUser: row.editedByUser,
        videoEnabled: row.videoEnabled,
        summary: summarizeStep({
          channel: normalizeChannel(row.channel),
          stepType: (row.stepType as SequenceStepSpec["stepType"]) || "action",
          delayHours: row.delayHours,
          config: parseJson(row.config, {}),
        }),
      })),
  };
}

export async function replaceSteps(workflowVersionId: string, spec: SequenceSpec) {
  if (!("workflowStep" in db) || !db.workflowStep) return [];
  const existing = await db.workflowStep.findMany({ where: { workflowVersionId } });
  const keepIds = new Set(spec.steps.map((step) => step.id).filter(Boolean) as string[]);

  await db.workflowStep.deleteMany({
    where: {
      workflowVersionId,
      id: { notIn: [...keepIds] },
      editedByUser: false,
    },
  });

  const written: SequenceStepView[] = [];
  for (const [index, step] of spec.steps.entries()) {
    const data = {
      workflowVersionId,
      order: index,
      channel: step.channel,
      stepType: step.stepType,
      config: JSON.stringify(step.config ?? {}),
      delayHours: step.delayHours ?? 0,
      condition: step.condition ?? null,
      editedByUser: Boolean(step.editedByUser),
      videoEnabled: Boolean(step.videoEnabled),
    };
    const row = step.id
      ? await db.workflowStep.upsert({
          where: { id: step.id },
          create: { id: step.id, ...data },
          update: existing.find((item) => item.id === step.id)?.editedByUser
            ? { order: index, delayHours: data.delayHours, condition: data.condition, videoEnabled: data.videoEnabled }
            : data,
        })
      : await db.workflowStep.create({ data });
    written.push({
      ...step,
      id: row.id,
      order: index,
      editedByUser: row.editedByUser,
      videoEnabled: row.videoEnabled,
      summary: summarizeStep({ ...step, config: parseJson(row.config, step.config) }),
      config: parseJson(row.config, step.config),
    });
  }

  const graph = specToGraph({ ...spec, steps: written });
  await db.workflowVersion.update({
    where: { id: workflowVersionId },
    data: {
      nodes: JSON.stringify(graph.nodes),
      edges: JSON.stringify(graph.edges),
    },
  });

  return written;
}

export async function ensureActiveVersion(campaignId: string) {
  const current = await db.workflowVersion.findFirst({
    where: { campaignId, isActive: true },
    include: { steps: { orderBy: { order: "asc" } } },
  });
  if (current) return current;
  return db.workflowVersion.create({
    data: {
      campaignId,
      version: 1,
      nodes: "[]",
      edges: "[]",
      isActive: true,
    },
    include: { steps: true },
  });
}

export async function loadSequence(campaignId: string) {
  const version = await ensureActiveVersion(campaignId);
  if (version.steps.length) {
    return { versionId: version.id, spec: rowToSpec(version.steps), steps: version.steps };
  }

  const graph = {
    name: "Sequence",
    nodes: parseJson(version.nodes, []),
    edges: parseJson(version.edges, []),
  };
  const spec = graphToSpec(graph);
  if (spec.steps.length) {
    const written = await replaceSteps(version.id, spec);
    return { versionId: version.id, spec: { ...spec, steps: written }, steps: written };
  }
  return { versionId: version.id, spec, steps: [] };
}
