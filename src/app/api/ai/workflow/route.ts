import { ai } from "@/lib/ai";
import { jsonError, jsonOk } from "../../_utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const workflow = await ai.generateWorkflow({
      request: body.request || "",
      goal: body.goal,
      channels: body.channels,
      audience: body.audience,
    });
    return jsonOk(workflow);
  } catch (error) {
    return jsonError(error);
  }
}
