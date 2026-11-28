import { createTtlCache } from "../cache/ttl-cache.helper";

const IMAGE_TIMEOUT_MS = 10_000;
const MAX_IMAGE_BYTES = 2_500_000;
const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png"]);

// Avatar URLs are user-set, so only TMDB and our own R2 bucket are ever fetched (no SSRF).
const allowedHosts = (): Set<string> => {
  const hosts = new Set(["image.tmdb.org"]);
  try {
    if (process.env.R2_PUBLIC_URL) hosts.add(new URL(process.env.R2_PUBLIC_URL).host);
  } catch {
    // An unparsable R2 URL just means avatars aren't fetched.
  }
  return hosts;
};

const fetchAsDataUri = async (url: string): Promise<string> => {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || !allowedHosts().has(parsed.host)) {
    throw new Error(`Image host not allowed: ${parsed.host}`);
  }

  const response = await fetch(parsed, { signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS) });
  const type = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  if (!response.ok || !SUPPORTED_TYPES.has(type)) {
    throw new Error(`Image unavailable (${response.status} ${type})`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error("Image too large");
  return `data:${type};base64,${bytes.toString("base64")}`;
};

// Failures throw inside the cache so they aren't remembered; the next card retries.
const cachedFetch = createTtlCache(fetchAsDataUri, { ttlMs: 60 * 60 * 1000, maxEntries: 120 });

// A card image as a data URI, or null when it is missing, slow or not allowed.
export const loadCardImage = async (url: string | null | undefined): Promise<string | null> => {
  if (!url) return null;
  try {
    return await cachedFetch(url);
  } catch {
    return null;
  }
};

// Loads a card's images in parallel; `complete` is false when any requested one failed,
// so callers can avoid caching a card that is missing artwork for long.
export const loadCardImages = async <K extends string>(urls: Record<K, string | null | undefined>) => {
  const keys = Object.keys(urls) as K[];
  const loaded = await Promise.all(keys.map((key) => loadCardImage(urls[key])));
  const images = Object.fromEntries(keys.map((key, index) => [key, loaded[index] ?? null])) as Record<K, string | null>;
  const complete = keys.every((key, index) => !urls[key] || loaded[index] !== null);
  return { images, complete };
};

export const loadCardImageList = async (urls: (string | null)[]) => {
  const images = await Promise.all(urls.map((url) => loadCardImage(url)));
  return { images, complete: images.every((image, index) => !urls[index] || image !== null) };
};
