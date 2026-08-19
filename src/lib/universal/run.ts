import { completeJson, isDeepSeekConfigured } from "../ai/deepseek";
import type { UniversalPlan, UniversalResult } from "./types";

const SYSTEM = `You are Haki Universal, a beta briefing engine inside Haki.

Haki Universal uses DeepSeek to plan, then queries allowed open-data APIs:
- Wikidata SPARQL for companies, founders, and CEOs
- OpenStreetMap Overpass for restaurants, shops, and local amenities

It does not scrape Zillow, Redfin, LinkedIn, Google, Maps, Crunchbase, Apollo, or ZoomInfo.
It does not invent emails or phones. Missing fields stay empty.

If the user asks for criminal, medical, or credential theft, or to break into a site, set refused true.

Return JSON only:
{
  "title": string,
  "audience": string,
  "geography": string,
  "columns": string[],
  "thoughts": string[],
  "notes": string,
  "refused": boolean,
  "refuseReason": string|null
}

thoughts: 5 short operator-facing planning steps that mention the open-data source.
columns: simple headers (company, first_name, last_name, title, email, city, state, website, ...).
notes: one sentence that this is a live open-data pass, not a listing-site scrape.`;

export function draftUniversal(message: string): UniversalResult {
  const request = message.trim();
  if (!request) {
    return {
      plan: {
        title: "Empty brief",
        audience: "",
        geography: "",
        columns: [],
        thoughts: [],
        notes: "Describe who you want and which columns.",
        refused: true,
        refuseReason: "Say who to reach and which fields you need.",
      },
      rows: [],
      filename: "haki-universal.csv",
      target: 0,
    };
  }
  return normalize(localPlan(request), request);
}

export async function enrichPlan(message: string, current: UniversalPlan): Promise<UniversalPlan> {
  if (!isDeepSeekConfigured() || current.refused) return current;
  try {
    const next = await completeJson<UniversalPlan>({
      system: SYSTEM,
      user: message,
    });
    return {
      ...current,
      title: next.title || current.title,
      audience: next.audience || current.audience,
      geography: next.geography || current.geography,
      thoughts: (next.thoughts ?? current.thoughts).slice(0, 8),
      notes: next.notes || current.notes,
      refused: Boolean(next.refused),
      refuseReason: next.refuseReason ?? current.refuseReason,
    };
  } catch {
    return current;
  }
}

export function rowLabel(row: Record<string, string>) {
  const name = [row.first_name, row.last_name].filter(Boolean).join(" ");
  const subject = row.company || row.address || name || "Record";
  const place = [row.city, row.state].filter(Boolean).join(", ");
  const fields = ["email", "phone", "website"].filter((key) => row[key] && row[key] !== "—");
  return [subject, place, fields.length ? fields.join(" + ") : null].filter(Boolean).join(" · ");
}

function normalize(raw: UniversalPlan, request: string): UniversalResult {
  const columns = [...new Set((raw.columns ?? []).map(cleanHeader).filter(Boolean))];
  const unique = columns.length ? columns : inferColumns(request);
  if (!unique.includes("source")) unique.push("source");
  const target = inferTarget(request);

  const plan: UniversalPlan = {
    title: raw.title || titleFrom(request),
    audience: raw.audience || request.slice(0, 80),
    geography: raw.geography || inferGeo(request),
    columns: unique,
    thoughts: (raw.thoughts ?? []).slice(0, 8),
    notes:
      raw.notes ||
      "Live open-data pass. Wikidata and OpenStreetMap only. Missing emails stay empty.",
    sources: raw.sources ?? ["Wikidata", "OpenStreetMap"],
    refused: Boolean(raw.refused),
    refuseReason: raw.refuseReason ?? undefined,
  };

  if (plan.refused) {
    return { plan, rows: [], filename: slug(plan.title) + ".csv", target: 0 };
  }

  return {
    plan,
    rows: [],
    filename: slug(plan.title) + ".csv",
    target,
  };
}

function localPlan(request: string): UniversalPlan {
  const columns = inferColumns(request);
  const geography = inferGeo(request);
  const source = /restaurant|cafe|coffee|shop|bar/i.test(request) ? "OpenStreetMap Overpass" : "Wikidata SPARQL";
  return {
    title: titleFrom(request),
    audience: request.slice(0, 96),
    geography,
    columns,
    sources: [source.replace(/ SPARQL| Overpass/, "")],
    thoughts: [
      "Read the brief and lock who we are collecting.",
      `Bound the pass to ${geography}.`,
      `Route DeepSeek to ${source}.`,
      "Query the public API and write each hit as it returns.",
      "Stop at the target or when the source is exhausted. Do not invent emails.",
    ],
    notes: `Live ${source} pass. Not Zillow, LinkedIn, or Google. Fields the source does not publish stay empty.`,
  };
}

export function inferTarget(request: string) {
  const numbered = request.match(/\b(\d{2,4})\b/);
  if (numbered) return Math.min(120, Math.max(12, Number(numbered[1])));
  if (/all|every|entire|full/i.test(request)) return 64;
  return 52;
}

function inferColumns(request: string) {
  const value = request.toLowerCase();
  const columns = ["company", "first_name", "last_name"];
  if (value.includes("founder") || value.includes("ceo") || value.includes("startup")) {
    columns.push("title", "email", "city", "state", "company_size", "website");
  }
  if (value.includes("email")) columns.push("email");
  if (value.includes("phone") || value.includes("hone")) columns.push("phone");
  if (value.includes("linkedin")) columns.push("linkedin");
  if (value.includes("city") || value.includes("texas") || value.includes("state") || value.includes("united")) {
    columns.push("city", "state");
  }
  if (value.includes("restaurant") || value.includes("shop")) columns.push("industry", "website", "phone");
  if (!columns.includes("email") && /founder|ceo|contact/i.test(value)) columns.push("email");
  columns.push("source");
  return [...new Set(columns)];
}

function inferGeo(request: string) {
  if (/united states|usa|america/i.test(request)) return "United States of America";
  const match = request.match(
    /\b(texas|california|florida|new york|houston|dallas|austin|chicago|miami)\b/i,
  );
  return match?.[1] ? titleFrom(match[1]) : "Unspecified";
}

function titleFrom(request: string) {
  const trimmed = request.replace(/\s+/g, " ").trim();
  if (!trimmed) return "Haki Universal";
  if (trimmed.length < 48) return trimmed[0].toUpperCase() + trimmed.slice(1);
  return trimmed.slice(0, 44) + "…";
}

function cleanHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "haki-universal";
}
