export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const payload = await response.json();

  if (!response.ok || payload.ok === false) {
    throw new Error(payload?.error?.message ?? "Request failed");
  }

  return payload as T;
}
