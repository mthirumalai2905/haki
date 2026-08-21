import type { WorkflowGraph } from "../types";

const KEY = "haki:sequence-seed";

export type SequenceSeed = {
  name: string;
  workflow: WorkflowGraph;
};

export function writeSequenceSeed(seed: SequenceSeed) {
  sessionStorage.setItem(KEY, JSON.stringify(seed));
}

export function readSequenceSeed(): SequenceSeed | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SequenceSeed;
  } catch {
    return null;
  }
}
