const GB_BASE = "https://www.googleapis.com/books/v1";

const getApiKey = () => process.env.GOOGLE_BOOKS_API_KEY ?? "";

export async function fetchGB(path: string, params: Record<string, string> = {}): Promise<unknown> {
  const url = new URL(`${GB_BASE}${path}`);
  const key = getApiKey();
  if (key) url.searchParams.set("key", key);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Google Books API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
