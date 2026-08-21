export function polishChatReply(text: string) {
  let value = (text || "").replace(/\r/g, "");
  value = value.replace(/[—–]/g, ". ");
  value = value.replace(/\s+--+\s+/g, ". ");
  value = value.replace(/^[-*]{3,}$/gm, "");
  value = value.replace(/::+/g, ":");
  value = value.replace(/[ \t]+\n/g, "\n");
  value = value.replace(/\n{3,}/g, "\n\n");
  return value.trim();
}
