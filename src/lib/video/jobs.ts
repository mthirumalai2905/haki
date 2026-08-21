import { db } from "../db";
import { parseJson } from "../utils";
import { defaultVideoPipeline, runVideoPipeline } from "./providers";

export async function setStepVideoEnabled(stepId: string, enabled: boolean) {
  const step = await db.workflowStep.update({
    where: { id: stepId },
    data: { videoEnabled: enabled },
  });
  if (!enabled) {
    await db.videoJob.updateMany({
      where: { stepId },
      data: { attached: false },
    });
  } else {
    await db.videoJob.updateMany({
      where: { stepId, status: "ready" },
      data: { attached: true },
    });
  }
  return step;
}

export async function enqueueVideoJobs(stepId: string, leadIds: string[]) {
  const created = [];
  for (const leadId of leadIds) {
    const existing = await db.videoJob.findUnique({
      where: { stepId_leadId: { stepId, leadId } },
    });
    if (existing?.status === "ready" && existing.attached) {
      created.push(existing);
      continue;
    }
    if (existing) {
      created.push(
        await db.videoJob.update({
          where: { id: existing.id },
          data: { status: "queued", attached: true, error: null },
        }),
      );
      continue;
    }
    created.push(
      await db.videoJob.create({
        data: { stepId, leadId, status: "queued", attached: true },
      }),
    );
  }
  return created;
}

export async function processVideoJobs(limit = 5) {
  const due = await db.videoJob.findMany({
    where: { status: { in: ["queued", "generating"] }, attached: true },
    include: {
      lead: { include: { company: true } },
      step: true,
    },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  for (const job of due) {
    await db.videoJob.update({ where: { id: job.id }, data: { status: "generating" } });
    try {
      const company = job.lead.company?.name || job.lead.fullName || "this business";
      const result = await runVideoPipeline(defaultVideoPipeline, {
        company,
        contact: job.lead.fullName || [job.lead.firstName, job.lead.lastName].filter(Boolean).join(" "),
        industry: job.lead.industry || job.lead.company?.industry,
        website: job.lead.website || job.lead.company?.website,
        jobId: job.id,
      });
      await db.videoJob.update({
        where: { id: job.id },
        data: {
          status: "ready",
          newsContext: JSON.stringify(result.news),
          script: result.script,
          videoUrl: result.videoUrl,
          generatedAt: new Date(),
          attached: true,
        },
      });
    } catch (error) {
      await db.videoJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          error: error instanceof Error ? error.message : "Video job failed",
        },
      });
    }
  }
  return due.length;
}

export function parseNews(value: string) {
  return parseJson(value, []);
}
