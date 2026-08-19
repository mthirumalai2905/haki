import { db } from "../db";
import { recordActivity } from "../activity";
import { gatherTwitterIntel, gatherYoutubeIntel } from "./intel";
import { personalize } from "../execution/personalize";
import { AppError } from "../errors";

export const TOUCHPOINT_ACTIONS = [
  "send_email",
  "follow_up_email",
  "connect_linkedin",
  "research_x",
  "research_youtube",
  "send_whatsapp",
] as const;

export type TouchpointAction = (typeof TOUCHPOINT_ACTIONS)[number];

export const TOUCHPOINT_SEQUENCE = [
  "send_email",
  "wait_24h",
  "follow_up_email if no engagement",
  "connect_linkedin if still no reply",
  "research_x",
  "research_youtube",
  "send_whatsapp using sapien",
] as const;

const TEMPLATES: Record<
  Exclude<TouchpointAction, "research_x" | "research_youtube">,
  { channel: string; subject?: string; body: string; event: string }
> = {
  send_email: {
    channel: "email",
    event: "email_sent",
    subject: "Quick note for {{company_name}}",
    body: "Hi {{first_name}}, noticed {{company_name}}. Simulated first touch — no email provider used.",
  },
  follow_up_email: {
    channel: "email",
    event: "email_sent",
    subject: "Re: {{company_name}}",
    body: "Hi {{first_name}}, following up after 24 hours with no engagement. Simulated.",
  },
  connect_linkedin: {
    channel: "linkedin",
    event: "linkedin_connection_sent",
    body: "Simulated LinkedIn connection to {{first_name}} at {{company_name}}.",
  },
  send_whatsapp: {
    channel: "whatsapp",
    event: "whatsapp_sent",
    body: "Hi {{first_name}} — YouTube sapien: {{youtube_sapien}}. Twitter sapien: {{twitter_sapien}}.",
  },
};

export function describeTouchpoints() {
  return {
    mode: "simulation" as const,
    providers: "none",
    actions: TOUCHPOINT_ACTIONS,
    sequence: TOUCHPOINT_SEQUENCE,
  };
}

export async function runTouchpoint(input: {
  workspaceId: string;
  action: string;
  leadId?: string;
  campaignId?: string;
}) {
  if (!TOUCHPOINT_ACTIONS.includes(input.action as TouchpointAction)) {
    throw new AppError("UNKNOWN_TOUCHPOINT", "Unknown touchpoint action.");
  }

  const action = input.action as TouchpointAction;
  const lead = input.leadId
    ? await db.lead.findFirst({
        where: { id: input.leadId, workspaceId: input.workspaceId },
        include: { company: true },
      })
    : await db.lead.findFirst({
        where: { workspaceId: input.workspaceId },
        include: { company: true },
      });
  if (!lead) throw new AppError("NO_LEAD", "No lead available for this touchpoint.");

  if (action === "research_x" || action === "research_youtube") {
    const intel = action === "research_x" ? gatherTwitterIntel(lead) : gatherYoutubeIntel(lead);
    const activity = await recordActivity({
      workspaceId: input.workspaceId,
      leadId: lead.id,
      campaignId: input.campaignId,
      channel: action === "research_x" ? "x" : "youtube",
      action: action === "research_x" ? "twitter_researched" : "youtube_researched",
      status: "intel",
      simulated: true,
      metadata: intel,
    });
    return { simulated: true, action, intel, activityId: activity.id };
  }

  const research = await db.activity.findMany({
    where: {
      leadId: lead.id,
      action: { in: ["twitter_researched", "youtube_researched"] },
    },
    orderBy: { createdAt: "desc" },
  });
  const extra: Record<string, string> = {};
  for (const item of research) {
    try {
      const meta = JSON.parse(item.metadata) as { sapien?: string };
      if (item.action === "twitter_researched" && meta.sapien) extra.twitter_sapien = meta.sapien;
      if (item.action === "youtube_researched" && meta.sapien) extra.youtube_sapien = meta.sapien;
    } catch {
      /* ignore */
    }
  }

  const template = TEMPLATES[action];
  const subject = personalize(template.subject, lead, extra);
  const body = personalize(template.body, lead, extra);
  const activity = await recordActivity({
    workspaceId: input.workspaceId,
    leadId: lead.id,
    campaignId: input.campaignId,
    channel: template.channel,
    action: template.event,
    status: "sent",
    simulated: true,
    metadata: { subject, preview: body, provider: "simulation" },
  });

  return {
    simulated: true,
    action,
    channel: template.channel,
    subject,
    body,
    activityId: activity.id,
  };
}
