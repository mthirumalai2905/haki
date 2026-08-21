import { jsonError, jsonOk } from "../../_utils";
import { defaultVideoPipeline, runVideoPipeline } from "@/lib/video/providers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const company = String(body.company || "Demo Shop");
    const result = await runVideoPipeline(defaultVideoPipeline, {
      company,
      contact: body.contact ? String(body.contact) : "Alex Operator",
      industry: body.industry ? String(body.industry) : "food service",
      website: body.website ? String(body.website) : null,
      jobId: "preview",
    });
    return jsonOk({
      simulated: true,
      company,
      ...result,
    });
  } catch (error) {
    return jsonError(error);
  }
}
