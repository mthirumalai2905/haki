import { parseTimeWindow } from "../workflow/ops";
import { normalizeChannel, type SequenceSpec, type SequenceStepSpec } from "./types";
import { mergeEdited } from "./compile";

export function applySequenceInstruction(spec: SequenceSpec, instruction: string): SequenceSpec | null {
  const text = instruction.toLowerCase();
  const steps = spec.steps.map((step) => ({ ...step, config: { ...step.config } }));

  const delayMatch = text.match(/(?:delay|wait|shorten|between).{0,40}?(\d+)\s*(hour|hr|day)/);
  if ((text.includes("shorten") || text.includes("delay") || text.includes("wait")) && delayMatch) {
    let hours = Number(delayMatch[1]);
    if (delayMatch[2].startsWith("day")) hours *= 24;
    const between = text.match(/step\s*(\d+).{0,12}step\s*(\d+)/);
    const targetIndex = between ? Math.max(0, Number(between[2]) - 1) : steps.findIndex((step, i) => i > 0 && step.delayHours > 0);
    if (targetIndex >= 0 && steps[targetIndex]) {
      steps[targetIndex].delayHours = hours;
      return { ...spec, steps };
    }
  }

  if (/\b(weekend|weekday)\b/.test(text) && !steps.some((step) => step.condition === "is_weekday")) {
    steps.splice(0, 0, {
      channel: "email",
      stepType: "condition",
      delayHours: 0,
      condition: "is_weekday",
      config: {},
      summary: "Weekday check",
    });
    return { ...spec, steps };
  }

  const window = parseTimeWindow(instruction);
  if (window && !steps.some((step) => step.condition === "in_send_window")) {
    steps.splice(0, 0, {
      channel: "email",
      stepType: "condition",
      delayHours: 0,
      condition: "in_send_window",
      config: { sendAfterHour: window.after, sendBeforeHour: window.before },
      summary: `Time window ${window.after}:00-${window.before}:00`,
    });
    return { ...spec, steps };
  }

  const addMatch = text.match(/add (?:a |an )?(follow-?up )?(\w+)(?: message| sms| email| task)?(?: after step\s*(\d+))?/);
  if (text.includes("add") && addMatch) {
    const channel = normalizeChannel(addMatch[2] === "follow" ? "email" : addMatch[2]);
    const after = addMatch[3] ? Number(addMatch[3]) : steps.length;
    const inserted: SequenceStepSpec = {
      channel,
      stepType: "action",
      delayHours: text.includes("day") ? 24 : 0,
      config: defaultConfig(channel),
    };
    steps.splice(Math.min(steps.length, Math.max(0, after)), 0, inserted);
    return { ...spec, steps };
  }

  const removeMatch = text.match(/remove|delete|drop/) && text.match(/step\s*(\d+)/);
  if (removeMatch) {
    const index = Number(removeMatch[1]) - 1;
    if (steps[index] && !steps[index].editedByUser) steps.splice(index, 1);
    return { ...spec, steps };
  }

  return null;
}

function defaultConfig(channel: SequenceStepSpec["channel"]) {
  if (channel === "email") {
    return {
      subject: "Quick note for {{company_name}}",
      body: "Hi {{first_name}},\n\nWanted to follow up with {{company_name}}.\n\n",
    };
  }
  if (channel === "linkedin") {
    return { message: "Hi {{first_name}}, I work with operators at companies like {{company_name}}." };
  }
  if (channel === "sms" || channel === "whatsapp") {
    return { message: "Hi {{first_name}}, circling back on {{company_name}}." };
  }
  return { taskNotes: "Call {{first_name}} at {{company_name}}." };
}

export function preserveEdits(current: SequenceSpec, next: SequenceSpec) {
  return mergeEdited(current, next);
}
