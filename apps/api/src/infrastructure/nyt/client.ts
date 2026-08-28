const NYT_BOOKS_BASE = "https://api.nytimes.com/svc/books/v3";

const getApiKey = () => process.env.NYT_BOOKS_API_KEY ?? "";

export async function fetchNyt(path: string, params: Record<string, string> = {}): Promise<unknown> {
  const key = getApiKey();
  if (!key) {
    throw new Error("NYT_BOOKS_API_KEY is not configured");
  }

  const url = new URL(`${NYT_BOOKS_BASE}${path}`);
  url.searchParams.set("api-key", key);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`NYT Books API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
