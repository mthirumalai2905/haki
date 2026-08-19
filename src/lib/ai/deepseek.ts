type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_call_id?: string;
  tool_calls?: DeepSeekToolCall[];
};

export type DeepSeekTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type DeepSeekToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export function isDeepSeekConfigured() {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

function client() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }
  return {
    apiKey,
    baseUrl: (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, ""),
    model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
  };
}

async function chat(body: Record<string, unknown>) {
  const { apiKey, baseUrl } = client();
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error("DeepSeek request failed");
  }
  return response.json() as Promise<{
    choices?: Array<{
      message?: {
        content?: string | null;
        tool_calls?: DeepSeekToolCall[];
      };
      finish_reason?: string;
    }>;
  }>;
}

export async function completeJson<T>(input: {
  system: string;
  user: string;
}): Promise<T> {
  const { model } = client();
  const payload = await chat({
    model,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `${input.system}\n\nAlways return valid JSON only.` },
      { role: "user", content: input.user },
    ],
  });
  const content = payload.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(extractJson(content)) as T;
}

export async function completeText(input: {
  system: string;
  user: string;
  temperature?: number;
}): Promise<string> {
  const { model } = client();
  const payload = await chat({
    model,
    temperature: input.temperature ?? 0.4,
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.user },
    ],
  });
  return (payload.choices?.[0]?.message?.content ?? "").trim();
}

export async function completeTools(input: {
  system: string;
  messages: Array<Record<string, unknown>>;
  tools: DeepSeekTool[];
}): Promise<{
  content: string;
  toolCalls: DeepSeekToolCall[];
  message: ChatMessage;
}> {
  const { model } = client();
  const payload = await chat({
    model,
    temperature: 0.2,
    tools: input.tools,
    tool_choice: "auto",
    messages: [{ role: "system", content: input.system }, ...input.messages],
  });
  const message = payload.choices?.[0]?.message ?? {};
  return {
    content: message.content ?? "",
    toolCalls: message.tool_calls ?? [],
    message: {
      role: "assistant",
      content: message.content,
      tool_calls: message.tool_calls,
    },
  };
}

export function extractJson(content: string) {
  const trimmed = content.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}
