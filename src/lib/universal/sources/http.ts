export const UA = "HakiUniversal/0.1 (https://github.com/mthirumalai2905/haki; open-data client)";

export async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(55000),
    headers: {
      Accept: "application/json",
      "User-Agent": UA,
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Open data request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function splitName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  return {
    first_name: parts[0] || "",
    last_name: parts.slice(1).join(" "),
  };
}

export function pickColumns(row: Record<string, string>, columns: string[]) {
  const next: Record<string, string> = {};
  for (const column of columns) {
    next[column] = row[column] ?? "";
  }
  return next;
}
