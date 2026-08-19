export type UniversalPlan = {
  title: string;
  audience: string;
  geography: string;
  columns: string[];
  thoughts: string[];
  notes: string;
  sources?: string[];
  refused?: boolean;
  refuseReason?: string;
};

export type UniversalResult = {
  plan: UniversalPlan;
  rows: Array<Record<string, string>>;
  filename: string;
  target: number;
};

export type UniversalStreamEvent =
  | { type: "plan"; plan: UniversalPlan; filename: string; target: number }
  | { type: "thought"; index: number; text: string }
  | { type: "status"; text: string }
  | { type: "hit"; found: number; target: number; row: Record<string, string>; label: string; source?: string }
  | { type: "done"; found: number; filename: string }
  | { type: "error"; message: string };

export type OpenSourceKind = "wikidata" | "overpass";
