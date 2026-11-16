import { isLinkPreviewBot } from "./bot-detection";
import { applyHeadTags, buildHeadTags, isShareMeta, type ShareMeta } from "./inject-meta";
import { metaPathFor } from "./meta-path";

export type LinkPreviewEnv = {
  // Optional overrides; VITE_API_BASE_URL is the same Pages variable the SPA build reads.
  LINK_PREVIEW_API_ORIGIN?: string;
  VITE_API_BASE_URL?: string;
};

const DEFAULT_API_ORIGIN = "https://api.interis.gorkemkaryol.dev";
const META_TIMEOUT_MS = 2_500;

const apiOriginOf = (env: LinkPreviewEnv): string => {
  for (const candidate of [env.LINK_PREVIEW_API_ORIGIN, env.VITE_API_BASE_URL]) {
    if (!candidate) continue;
    try {
      return new URL(candidate).origin;
    } catch {
      // Not an absolute URL (e.g. an empty or relative base); try the next one.
    }
  }
  return DEFAULT_API_ORIGIN;
};

const fetchMeta = async (url: string): Promise<ShareMeta | null> => {
  try {
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(META_TIMEOUT_MS),
      // Cloudflare doesn't cache JSON by default; this shares meta across edge requests.
      cf: { cacheEverything: true, cacheTtlByStatus: { "200-299": 3600, "404": 300, "500-599": 0 } },
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    return isShareMeta(body) ? body : null;
  } catch {
    return null;
  }
};

// Shared by every route in functions/: humans get the SPA untouched (no API call); link-preview
// bots get index.html with the page's own title, description and card. Any failure → plain page.
export const handleLinkPreview: PagesFunction<LinkPreviewEnv> = async (context) => {
  const url = new URL(context.request.url);
  const metaPath = metaPathFor(url.pathname);
  if (!metaPath || !isLinkPreviewBot(context.request.headers.get("user-agent"))) {
    return context.next();
  }

  const apiOrigin = apiOriginOf(context.env);
  const [page, meta] = await Promise.all([context.next(), fetchMeta(`${apiOrigin}/api/public/meta${metaPath}`)]);
  if (!meta || !page.ok || !page.headers.get("content-type")?.includes("text/html")) {
    return page;
  }

  const tags = buildHeadTags(meta, { siteOrigin: url.origin, apiOrigin });
  const rewritten = applyHeadTags(new HTMLRewriter(), tags).transform(page);
  const response = new Response(rewritten.body, rewritten);
  response.headers.append("Vary", "User-Agent");
  return response;
};
