import type { WorkflowNodeData } from "../types";

export type PaletteItem = {
  id: string;
  label: string;
  type: WorkflowNodeData["type"];
  data: Partial<WorkflowNodeData>;
};

export const PALETTE: PaletteItem[] = [
  { id: "trigger", label: "Lead enters", type: "trigger", data: { type: "trigger", label: "Lead enters campaign" } },
  { id: "email", label: "Email", type: "action", data: { type: "action", label: "Send email", action: "send_email", channel: "email", available: true } },
  { id: "whatsapp", label: "WhatsApp", type: "action", data: { type: "action", label: "WhatsApp", action: "send_whatsapp", channel: "whatsapp", available: true } },
  { id: "instagram", label: "Instagram", type: "action", data: { type: "action", label: "Instagram", action: "send_linkedin", channel: "instagram", available: true } },
  { id: "linkedin", label: "LinkedIn", type: "action", data: { type: "action", label: "LinkedIn", action: "send_linkedin", channel: "linkedin", available: true } },
  { id: "linkedin_connect", label: "LinkedIn connect", type: "action", data: { type: "action", label: "LinkedIn connection", action: "connect_linkedin", channel: "linkedin", available: true } },
  { id: "research_x", label: "Check Twitter", type: "action", data: { type: "action", label: "Check Twitter", description: "Simulated public context", action: "research_x", channel: "x", available: true } },
  { id: "research_youtube", label: "Check YouTube", type: "action", data: { type: "action", label: "Check YouTube", description: "New sapien / intel", action: "research_youtube", channel: "youtube", available: true } },
  { id: "sms", label: "SMS", type: "action", data: { type: "action", label: "Send SMS", action: "send_sms", channel: "sms", available: true } },
  { id: "wait", label: "Wait", type: "wait", data: { type: "wait", label: "Wait 24 hours", waitHours: 24 } },
  { id: "condition", label: "Condition", type: "condition", data: { type: "condition", label: "Has replied?", condition: "email_replied" } },
  { id: "end", label: "Stop", type: "end", data: { type: "end", label: "Stop" } },
];

export function nodeFromPalette(item: PaletteItem, position: { x: number; y: number }) {
  return {
    id: `n${Date.now()}${Math.floor(Math.random() * 99)}`,
    type: "haki",
    position,
    data: {
      label: item.label,
      ...item.data,
    } as WorkflowNodeData,
  };
}
