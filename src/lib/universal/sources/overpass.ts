import { getJson } from "./http";

type OverpassElement = {
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

const CITIES: Record<string, string> = {
  austin: "Austin",
  dallas: "Dallas",
  houston: "Houston",
  "san antonio": "San Antonio",
  "new york": "New York",
  chicago: "Chicago",
  seattle: "Seattle",
  miami: "Miami",
  denver: "Denver",
  boston: "Boston",
  "san francisco": "San Francisco",
  "los angeles": "Los Angeles",
};

export async function collectOverpass(input: {
  brief: string;
  target: number;
  geography: string;
}): Promise<Array<Record<string, string>>> {
  const amenity = inferAmenity(input.brief);
  const city = inferCity(input.brief, input.geography);
  const limit = Math.min(120, Math.max(20, input.target));
  const query = `
[out:json][timeout:25];
area["name"="${city}"]["boundary"="administrative"]->.searchArea;
(
  node["amenity"="${amenity}"](area.searchArea);
  way["amenity"="${amenity}"](area.searchArea);
);
out tags ${limit};
`.trim();

  const payload = await getJson<OverpassResponse>("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  const seen = new Set<string>();
  const rows: Array<Record<string, string>> = [];

  for (const element of payload.elements ?? []) {
    const tags = element.tags ?? {};
    const company = tags.name?.trim();
    if (!company || seen.has(company.toLowerCase())) continue;
    seen.add(company.toLowerCase());
    const contact = splitContact(tags["contact:email"] || tags.email || "");
    rows.push({
      company,
      first_name: "",
      last_name: "",
      title: "",
      email: contact,
      phone: tags.phone || tags["contact:phone"] || "",
      website: tags.website || tags["contact:website"] || "",
      city: tags["addr:city"] || city,
      state: tags["addr:state"] || "",
      address: [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "),
      industry: amenity,
      source: "openstreetmap",
    });
  }

  return rows.slice(0, input.target);
}

function inferAmenity(brief: string) {
  const value = brief.toLowerCase();
  if (value.includes("cafe") || value.includes("coffee")) return "cafe";
  if (value.includes("bar") || value.includes("pub")) return "bar";
  if (value.includes("shop") || value.includes("store")) return "marketplace";
  return "restaurant";
}

function inferCity(brief: string, geography: string) {
  const value = `${brief} ${geography}`.toLowerCase();
  for (const [key, name] of Object.entries(CITIES)) {
    if (value.includes(key)) return name;
  }
  if (value.includes("texas")) return "Austin";
  return "Austin";
}

function splitContact(value: string) {
  return value.replace(/^mailto:/, "").trim();
}
