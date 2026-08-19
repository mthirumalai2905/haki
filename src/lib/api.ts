export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.error?.message || "Request failed");
  }
  return payload.data as T;
}
