export const DOCS_URL = "https://docs.interis.gorkemkaryol.dev";

// Absolute, so snippets still work when pasted onto another site.
export const publicApiBase = (): string =>
  `${(import.meta.env.VITE_API_BASE_URL || window.location.origin).replace(/\/$/, "")}/api/public`;

// Limits mirror public-query-normalizer.helper.ts in the API: "default / max", or null when there's none.
export const PUBLIC_ENDPOINTS: ReadonlyArray<{ path: string; description: string; limits: string | null }> = [
  { path: "/profile", description: "Profile summary and counts", limits: null },
  { path: "/top4", description: "Top 4 films and series", limits: null },
  { path: "/recent", description: "Recent activity, one entry per title per day", limits: "10 / 20" },
  { path: "/activity", description: "Longer activity timeline", limits: "30 / 100" },
  { path: "/diary", description: "Diary logs, films and TV (offset ≤ 5000)", limits: "50 / 200" },
  { path: "/reviews", description: "Reviews with the title", limits: "50 / 200" },
  { path: "/lists", description: "Public lists and their entries", limits: "50 / 200" },
  { path: "/likes", description: "Liked films and series", limits: "50 / 200" },
  { path: "/watchlist", description: "Watchlist", limits: "50 / 200" },
  { path: "/movies/watched", description: "Watched films", limits: "50 / 200" },
  { path: "/serials/watched", description: "Finished series", limits: "50 / 200" },
  { path: "/serials/currently-watching", description: "Series in progress", limits: "10 / 30" },
  { path: "/serials/:tmdbId", description: "Progress on one series", limits: null },
];

export type TryEndpoint = "diary" | "currently-watching";

// Each option names where a title lives in its response, so the HTML snippet stays truthful.
export const TRY_ENDPOINTS: Record<TryEndpoint, { path: string; max: number; titleExpr: string }> = {
  diary: { path: "diary", max: 200, titleExpr: "item.media.title" },
  "currently-watching": { path: "serials/currently-watching", max: 30, titleExpr: "item.title" },
};

export type SnippetKind = "fetch" | "curl" | "html";

export const buildSnippet = (kind: SnippetKind, url: string, endpoint: TryEndpoint): string => {
  if (kind === "curl") return `curl "${url}"`;
  if (kind === "fetch") {
    return `const res = await fetch("${url}");\nconst items = await res.json();\nconsole.log(items);`;
  }
  return [
    `<ul id="interis"></ul>`,
    `<script>`,
    `  fetch("${url}")`,
    `    .then((res) => res.json())`,
    `    .then((items) => {`,
    `      document.getElementById("interis").innerHTML = items`,
    `        .map((item) => "<li>" + ${TRY_ENDPOINTS[endpoint].titleExpr} + "</li>")`,
    `        .join("");`,
    `    });`,
    `</script>`,
  ].join("\n");
};
