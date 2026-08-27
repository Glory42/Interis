const ITUNES_SEARCH_URL = "https://itunes.apple.com/search";

export async function fetchItunes(params: Record<string, string>): Promise<unknown> {
  const url = new URL(ITUNES_SEARCH_URL);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`iTunes Search API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
