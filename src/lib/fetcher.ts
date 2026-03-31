export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const rawText = await response.text();
  const payload = isJson && rawText ? JSON.parse(rawText) as Record<string, unknown> : null;

  if (!response.ok || payload?.ok === false) {
    const errorValue = payload?.error;
    const message = typeof errorValue === "string"
      ? errorValue
      : typeof errorValue === "object" && errorValue !== null && "message" in errorValue
        ? String(errorValue.message)
        : rawText || response.statusText || "Request failed";
    throw new Error(message);
  }

  return (payload ?? rawText) as T;
}
