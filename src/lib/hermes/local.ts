import type { HermesTurn } from "./types";

export function missingDeepSeekTurn(): HermesTurn {
  return {
    reply:
      "Haki chat runs on DeepSeek. Add DEEPSEEK_API_KEY on the server. I will not invent a campaign or answer off-product while the model is missing.",
    toolsUsed: [],
    provider: "local",
  };
}
