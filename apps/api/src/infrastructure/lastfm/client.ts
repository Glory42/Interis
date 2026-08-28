const LASTFM_BASE = "https://ws.audioscrobbler.com/2.0/";

const getApiKey = () => process.env.LASTFM_API_KEY ?? "";

export async function fetchLastfm(params: Record<string, string>): Promise<unknown> {
  const key = getApiKey();
  if (!key) {
    throw new Error("LASTFM_API_KEY is not configured");
  }

  const url = new URL(LASTFM_BASE);
  url.searchParams.set("api_key", key);
  url.searchParams.set("format", "json");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Last.fm API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { error?: number; message?: string };
  if (data.error) {
    throw new Error(`Last.fm API error ${data.error}: ${data.message ?? "unknown"}`);
  }

  return data;
}
