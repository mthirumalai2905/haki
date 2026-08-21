import type { LucideIcon } from "lucide-react";
import {
  Camera,
  Clock,
  GitBranch,
  Mail,
  MessageCircle,
  Phone,
  Play,
  Square,
  UserRound,
  Video,
} from "lucide-react";
import type { WorkflowNodeData } from "@/lib/types";

export const CHANNEL_TONE: Record<string, { ink: string; soft: string; label: string }> = {
  email: { ink: "#007aff", soft: "#e8f1ff", label: "Email" },
  linkedin: { ink: "#0a66c2", soft: "#e8f2fb", label: "LinkedIn" },
  whatsapp: { ink: "#128c7e", soft: "#e4f6f3", label: "WhatsApp" },
  sms: { ink: "#5856d6", soft: "#ededff", label: "SMS" },
  phone: { ink: "#34c759", soft: "#e4f8ea", label: "Phone" },
  instagram: { ink: "#c13584", soft: "#f8e8f1", label: "Instagram" },
  x: { ink: "#1d1d1f", soft: "#f2f2f7", label: "X" },
  youtube: { ink: "#ff3b30", soft: "#ffe8e6", label: "YouTube" },
};

const TYPE_TONE: Record<string, { ink: string; soft: string; label: string }> = {
  trigger: { ink: "#1d1d1f", soft: "#f2f2f7", label: "Start" },
  wait: { ink: "#c93400", soft: "#fff1e8", label: "Wait" },
  condition: { ink: "#5856d6", soft: "#ededff", label: "Check" },
  end: { ink: "#6e6e73", soft: "#f2f2f7", label: "End" },
  action: { ink: "#007aff", soft: "#e8f1ff", label: "Action" },
  ai_decision: { ink: "#007aff", soft: "#e8f1ff", label: "Decide" },
};

export function nodeTone(data: WorkflowNodeData) {
  if (data.channel && CHANNEL_TONE[data.channel]) return CHANNEL_TONE[data.channel];
  return TYPE_TONE[data.type] || TYPE_TONE.action;
}

export function nodeIcon(data: WorkflowNodeData): LucideIcon {
  if (data.channel === "email") return Mail;
  if (data.channel === "linkedin") return UserRound;
  if (data.channel === "whatsapp" || data.channel === "sms") return MessageCircle;
  if (data.channel === "phone") return Phone;
  if (data.channel === "instagram") return Camera;
  if (data.channel === "youtube") return Video;
  if (data.type === "wait") return Clock;
  if (data.type === "condition") return GitBranch;
  if (data.type === "end") return Square;
  if (data.type === "trigger") return Play;
  return Mail;
}

export function nodeKind(data: WorkflowNodeData) {
  if (data.type === "trigger") return "Start";
  if (data.type === "wait") return "Wait";
  if (data.type === "condition") return "Check";
  if (data.type === "end") return "End";
  return CHANNEL_TONE[data.channel ?? ""]?.label || "Action";
}
