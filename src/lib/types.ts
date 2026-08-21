export const LEAD_FIELDS = [
  "company",
  "first_name",
  "last_name",
  "full_name",
  "job_title",
  "email",
  "phone",
  "linkedin",
  "whatsapp",
  "reddit",
  "x",
  "instagram",
  "youtube",
  "tiktok",
  "google_workspace",
  "website",
  "country",
  "industry",
  "company_size",
  "source",
] as const;

export type LeadField = (typeof LEAD_FIELDS)[number] | "custom" | "ignore";

export type FieldMapping = {
  source: string;
  target: LeadField;
  confidence: "high" | "medium" | "low";
};

export type ImportStats = {
  rows: number;
  columns: number;
  validEmails: number;
  validPhones: number;
  duplicates: number;
  missingFields: number;
};

export type Audience = {
  type: "all" | "filtered" | "selected" | "qualified" | "saved";
  leadIds?: string[];
  filters?: LeadFilters;
  count?: number;
};

export type LeadFilters = {
  search?: string;
  industry?: string;
  country?: string;
  companySize?: string;
  jobTitle?: string;
  status?: string;
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasLinkedin?: boolean;
  minScore?: number;
};

export type CampaignGoal =
  | "book_meetings"
  | "generate_replies"
  | "start_conversations"
  | "drive_website_visits"
  | "generate_leads"
  | "custom";

export type WorkflowNodeType =
  | "trigger"
  | "action"
  | "condition"
  | "wait"
  | "ai_decision"
  | "end";

export type ChannelId =
  | "email"
  | "sms"
  | "phone"
  | "linkedin"
  | "whatsapp"
  | "x"
  | "reddit"
  | "instagram"
  | "youtube";

export type ActionKind =
  | "send_email"
  | "send_sms"
  | "make_call"
  | "send_linkedin"
  | "connect_linkedin"
  | "send_whatsapp"
  | "send_x"
  | "send_reddit"
  | "research_x"
  | "research_youtube"
  | "qualify";

export type ConditionKind =
  | "email_opened"
  | "email_replied"
  | "link_clicked"
  | "sms_replied"
  | "call_answered"
  | "linkedin_connected"
  | "linkedin_replied"
  | "meeting_booked"
  | "positive_reply"
  | "negative_reply"
  | "no_response"
  | "any_engagement"
  | "is_weekday"
  | "in_send_window";

export type WorkflowNodeData = {
  label: string;
  description?: string;
  type: WorkflowNodeType;
  action?: ActionKind;
  channel?: ChannelId;
  condition?: ConditionKind;
  waitHours?: number;
  weekdayOnly?: boolean;
  sendAfterHour?: number;
  sendBeforeHour?: number;
  subject?: string;
  body?: string;
  available?: boolean;
};

export type WorkflowGraph = {
  name: string;
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: WorkflowNodeData;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    label?: string;
  }>;
};

export type QualificationResult = {
  score: number;
  status: "qualified" | "maybe" | "unqualified";
  reason: string;
};

export type IcpDefinition = {
  name?: string | null;
  industry?: string | null;
  companySize?: string | null;
  location?: string | null;
  jobTitle?: string | null;
  description?: string | null;
};

export const CHANNELS: Array<{
  id: ChannelId;
  label: string;
  action: ActionKind;
  implemented: boolean;
}> = [
  { id: "email", label: "Email", action: "send_email", implemented: true },
  { id: "sms", label: "SMS", action: "send_sms", implemented: true },
  { id: "phone", label: "Phone", action: "make_call", implemented: true },
  { id: "linkedin", label: "LinkedIn", action: "send_linkedin", implemented: true },
  { id: "whatsapp", label: "WhatsApp", action: "send_whatsapp", implemented: true },
  { id: "x", label: "X", action: "send_x", implemented: true },
  { id: "reddit", label: "Reddit", action: "send_reddit", implemented: true },
  { id: "instagram", label: "Instagram", action: "send_linkedin", implemented: false },
  { id: "youtube", label: "YouTube", action: "send_linkedin", implemented: false },
];

export const GOAL_OPTIONS: Array<{ id: CampaignGoal; label: string; hint: string }> = [
  { id: "book_meetings", label: "Book meetings", hint: "Get discovery or demo calls on the calendar" },
  { id: "generate_replies", label: "Generate replies", hint: "Start conversations that get a response" },
  { id: "start_conversations", label: "Start conversations", hint: "Open a multi-channel dialogue" },
  { id: "drive_website_visits", label: "Drive website visits", hint: "Send people to a page or offer" },
  { id: "generate_leads", label: "Generate leads", hint: "Qualify interest from an existing list" },
  { id: "custom", label: "Custom", hint: "Describe the outcome in your own words" },
];
