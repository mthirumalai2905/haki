import { getJson, splitName } from "./http";

type SparqlBinding = Record<string, { value?: string } | undefined>;

type SparqlResponse = {
  results?: { bindings?: SparqlBinding[] };
};

export async function collectWikidata(input: {
  target: number;
  geography: string;
  columns: string[];
}): Promise<Array<Record<string, string>>> {
  const limit = Math.min(120, Math.max(20, input.target));
  const query = `
SELECT DISTINCT ?companyLabel ?personLabel ?title ?website ?cityLabel ?employees ?email WHERE {
  VALUES ?type { wd:Q129238 wd:Q18388277 wd:Q1668024 wd:Q1058914 }
  ?company wdt:P31 ?type ;
           wdt:P17 wd:Q30 ;
           wdt:P112 ?person .
  BIND("Founder" AS ?title)
  OPTIONAL { ?company wdt:P856 ?website }
  OPTIONAL { ?company wdt:P159 ?city }
  OPTIONAL { ?company wdt:P1128 ?employees }
  OPTIONAL { ?person wdt:P968 ?email }
  FILTER(!BOUND(?employees) || (?employees >= 10 && ?employees <= 5000))
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT ${limit}
`.trim();

  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`;
  const payload = await getJson<SparqlResponse>(url, {
    headers: { Accept: "application/sparql-results+json" },
  });

  const seen = new Set<string>();
  const rows: Array<Record<string, string>> = [];

  for (const item of payload.results?.bindings ?? []) {
    const company = item.companyLabel?.value?.trim() || "";
    const person = item.personLabel?.value?.trim() || "";
    if (!company || !person || /^Q\d+$/.test(company) || /^Q\d+$/.test(person)) continue;
    const key = `${company}::${person}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const name = splitName(person);
    const employees = item.employees?.value;
    rows.push({
      company,
      first_name: name.first_name,
      last_name: name.last_name,
      title: item.title?.value || "Founder",
      email: item.email?.value?.replace(/^mailto:/, "") || "",
      website: item.website?.value || "",
      city: item.cityLabel?.value || "",
      state: /united states|usa|america/i.test(input.geography) ? "US" : "",
      company_size: employees ? `${employees}` : "",
      industry: "",
      phone: "",
      linkedin: "",
      source: "wikidata",
    });
  }

  return rows.slice(0, input.target);
}
