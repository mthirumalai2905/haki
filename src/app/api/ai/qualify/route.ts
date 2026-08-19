import { ai } from "@/lib/ai";
import { jsonError, jsonOk } from "../../_utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await ai.qualifyLead(body.lead ?? {}, body.icp ?? {});
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
