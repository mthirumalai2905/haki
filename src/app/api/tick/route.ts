import { processDue } from "@/lib/execution/engine";
import { jsonError, jsonOk } from "../_utils";

export async function POST() {
  try {
    const processed = await processDue(40);
    return jsonOk({ processed });
  } catch (error) {
    return jsonError(error);
  }
}
