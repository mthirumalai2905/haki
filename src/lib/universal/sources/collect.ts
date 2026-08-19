import { completeJson, isDeepSeekConfigured } from "../../ai/deepseek";
import type { OpenSourceKind, UniversalPlan } from "../types";
import { pickColumns } from "./http";
import { collectOverpass } from "./overpass";
import { collectWikidata } from "./wikidata";

const BLOCKED =
  /zillow|redfin|linkedin|google maps|maps\.google|apollo\.io|zoominfo|hunter\.io|crunchbase|facebook|instagram/i;

type Route = {
  source: OpenSourceKind;
  reason: string;
};

export async function routeOpenSource(brief: string): Promise<Route> {
  if (isDeepSeekConfigured()) {
    try {
      const next = await completeJson<Route>({
        system: `You route Haki Universal briefs to allowed open-data APIs.

Allowed:
- wikidata: companies, founders, CEOs, startups, organizations
- overpass: restaurants, cafes, shops, local amenities (OpenStreetMap)

Forbidden: Zillow, Redfin, LinkedIn, Google, Maps, Crunchbase, Apollo, ZoomInfo, Facebook, or any login site.
If the brief is founders/startups/CEOs, pick wikidata.
If the brief is restaurants/shops/cafes in a city, pick overpass.
Return JSON only: {"source":"wikidata"|"overpass","reason":string}`,
        user: brief,
      });
      if (next.source === "overpass" || next.source === "wikidata") return next;
    } catch {
      // fall through
    }
  }

  if (/restaurant|cafe|coffee|shop|bar|pub/i.test(brief)) {
    return { source: "overpass", reason: "Local amenity brief → OpenStreetMap Overpass." };
  }
  return { source: "wikidata", reason: "Company or founder brief → Wikidata SPARQL." };
}

export function blockedBrief(brief: string) {
  if (!BLOCKED.test(brief)) return null;
  return "That source is not allowed. Universal queries Wikidata and OpenStreetMap only — not Zillow, Redfin, LinkedIn, or Google.";
}

export async function collectOpenData(input: {
  brief: string;
  plan: UniversalPlan;
  target: number;
}): Promise<{ rows: Array<Record<string, string>>; source: string; reason: string }> {
  const blocked = blockedBrief(input.brief);
  if (blocked && /zillow|redfin|linkedin|google maps|apollo|zoominfo|hunter|crunchbase/i.test(input.brief)) {
    const stillOpen = /founder|startup|ceo|restaurant|shop|company/i.test(input.brief);
    if (!stillOpen) {
      throw new Error(blocked);
    }
  }

  const route = await routeOpenSource(input.brief);
  const raw =
    route.source === "overpass"
      ? await collectOverpass({
          brief: input.brief,
          target: input.target,
          geography: input.plan.geography,
        })
      : await collectWikidata({
          target: input.target,
          geography: input.plan.geography,
          columns: input.plan.columns,
        });

  const rows = raw.map((row) => pickColumns({ ...row, source: row.source || route.source }, uniqueColumns(input.plan.columns)));
  return {
    rows,
    source: route.source === "overpass" ? "OpenStreetMap" : "Wikidata",
    reason: route.reason,
  };
}

function uniqueColumns(columns: string[]) {
  return [...new Set([...columns, "source"])];
}
