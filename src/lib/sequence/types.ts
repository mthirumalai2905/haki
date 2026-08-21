export const SEQUENCE_CHANNELS = [
  "email",
  "linkedin",
  "sms",
  "call_task",
  "whatsapp",
  "x",
  "phone",
] as const;

export type SequenceChannel = (typeof SEQUENCE_CHANNELS)[number];

export type SequenceStepType = "action" | "wait" | "condition";

export type StepConfig = {
  subject?: string;
  body?: string;
  message?: string;
  connectionNote?: string;
  taskNotes?: string;
  sendAfterHour?: number;
  sendBeforeHour?: number;
};

export type SequenceStepSpec = {
  id?: string;
  channel: SequenceChannel;
  stepType: SequenceStepType;
  delayHours: number;
  condition?: string | null;
  config: StepConfig;
  editedByUser?: boolean;
  videoEnabled?: boolean;
  summary?: string;
};

export type SequenceSpec = {
  name: string;
  goal?: string;
  steps: SequenceStepSpec[];
};

export type SequenceStepView = SequenceStepSpec & {
  id: string;
  order: number;
  videoStatus?: "off" | "queued" | "generating" | "ready" | "failed";
};

export function isSequenceChannel(value: string): value is SequenceChannel {
  return (SEQUENCE_CHANNELS as readonly string[]).includes(value);
}

export function normalizeChannel(value: string): SequenceChannel {
  const raw = value.toLowerCase().replace(/\s+/g, "_");
  if (raw === "call" || raw === "phone_call" || raw === "calltask") return "call_task";
  if (raw === "text" || raw === "text_message") return "sms";
  if (raw === "twitter") return "x";
  if (isSequenceChannel(raw)) return raw;
  if (raw === "phone") return "phone";
  return "email";
}

export function summarizeStep(step: SequenceStepSpec) {
  if (step.summary) return step.summary;
  if (step.stepType === "wait") return `Wait ${step.delayHours || 24}h`;
  if (step.stepType === "condition") return step.condition || "Branch";
  const config = step.config;
  if (step.channel === "email") return config.subject || "Email";
  if (step.channel === "linkedin") return config.connectionNote ? "LinkedIn connect" : "LinkedIn message";
  if (step.channel === "sms") return "SMS";
  if (step.channel === "call_task" || step.channel === "phone") return "Call task";
  if (step.channel === "whatsapp") return "WhatsApp";
  if (step.channel === "x") return "X";
  return step.channel;
}
