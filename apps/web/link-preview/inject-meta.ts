// The compact meta the API returns from /api/public/meta/* (see public-share.dto.ts).
export type ShareMeta = {
  ogType: string;
  title: string;
  description: string;
  image: string | null;
  path: string;
};

// The slice of the HTMLRewriter API used here, so the Workers runtime and the wasm build in
// tests can both drive it.
type RewriterElement = {
  remove(): unknown;
  append(content: string, options: { html: boolean }): unknown;
};
export type MetaRewriter<R> = { on(selector: string, handlers: { element(element: RewriterElement): void }): R };

const SITE_NAME = "Interis";
const FALLBACK_IMAGE_PATH = "/og-image.png";
const GENERATED_CARD_PREFIX = "/api/public/og/";

// Every head tag a preview reads; the SPA's generic ones are removed before ours go in.
export const REPLACED_HEAD_SELECTORS = [
  "title",
  'meta[name="description"]',
  'meta[property^="og:"]',
  'meta[name^="twitter:"]',
  'link[rel="canonical"]',
];

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const isShareMeta = (value: unknown): value is ShareMeta => {
  if (!value || typeof value !== "object") return false;
  const meta = value as Record<string, unknown>;
  return (
    typeof meta.title === "string" &&
    typeof meta.description === "string" &&
    typeof meta.ogType === "string" &&
    typeof meta.path === "string" &&
    meta.path.startsWith("/") &&
    (meta.image === null || typeof meta.image === "string")
  );
};

// The head tags for one page. `siteOrigin` is the web app's, `apiOrigin` resolves card paths.
export const buildHeadTags = (meta: ShareMeta, origins: { siteOrigin: string; apiOrigin: string }): string => {
  const pageUrl = new URL(meta.path, origins.siteOrigin).toString();
  const isCard = meta.image?.startsWith(GENERATED_CARD_PREFIX) ?? false;
  const imageUrl = meta.image
    ? new URL(meta.image, origins.apiOrigin).toString()
    : new URL(FALLBACK_IMAGE_PATH, origins.siteOrigin).toString();

  const tag = (attribute: "name" | "property", key: string, content: string) =>
    `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`;

  return [
    `<title>${escapeHtml(meta.title)} — ${SITE_NAME}</title>`,
    tag("name", "description", meta.description),
    `<link rel="canonical" href="${escapeHtml(pageUrl)}" />`,
    tag("property", "og:type", meta.ogType),
    tag("property", "og:site_name", SITE_NAME),
    tag("property", "og:title", meta.title),
    tag("property", "og:description", meta.description),
    tag("property", "og:url", pageUrl),
    tag("property", "og:image", imageUrl),
    isCard && tag("property", "og:image:type", "image/jpeg"),
    isCard && tag("property", "og:image:width", "1200"),
    isCard && tag("property", "og:image:height", "630"),
    tag("property", "og:image:alt", meta.title),
    tag("name", "twitter:card", "summary_large_image"),
    tag("name", "twitter:title", meta.title),
    tag("name", "twitter:description", meta.description),
    tag("name", "twitter:image", imageUrl),
  ]
    .filter(Boolean)
    .join("\n    ");
};

// Registers the head rewrite on `rewriter`: drop the generic tags, append the page's own.
export const applyHeadTags = <R extends MetaRewriter<R>>(rewriter: R, tags: string): R => {
  let next = rewriter;
  for (const selector of REPLACED_HEAD_SELECTORS) {
    next = next.on(selector, { element: (element) => void element.remove() });
  }
  return next.on("head", { element: (element) => void element.append(`\n    ${tags}\n  `, { html: true }) });
};
