import { ai } from "@/lib/ai";
import { jsonError, jsonOk } from "../../_utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.instruction && body.body) {
      const rewritten = await ai.rewriteMessage(body.body, body.instruction);
      return jsonOk(rewritten);
    }
    const message = await ai.generateMessage({
      lead: body.lead,
      company: body.company,
      goal: body.goal,
      channel: body.channel || "email",
      tone: body.tone,
      customFields: body.customFields,
    });
    return jsonOk(message);
  } catch (error) {
    return jsonError(error);
  }
}
