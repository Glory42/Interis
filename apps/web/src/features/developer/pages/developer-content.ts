import type { LucideIcon } from "lucide-react";
import { Activity, FileText, LayoutDashboard, Zap } from "lucide-react";

export type UseCaseTone = "primary" | "cinema" | "serial" | "destructive";

export type UseCase = {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: UseCaseTone;
};

export type PublicEndpoint = {
  method: "GET";
  path: string;
  description: string;
};

export type CodeExample = {
  title: string;
  code: string;
  language: string;
};

export const useCases: readonly UseCase[] = [
  {
    title: "Portfolio Widget",
    description:
      "Show your Top 4 cinema and serial picks directly on your personal website.",
    icon: LayoutDashboard,
    tone: "primary",
  },
  {
    title: "Live Activity Block",
    description:
      "Display your latest activity stream in a small sidebar or homepage module.",
    icon: Activity,
    tone: "cinema",
  },
  {
    title: "Review Feed",
    description:
      "Pull your public reviews into a blog, newsletter footer, or personal changelog.",
    icon: FileText,
    tone: "serial",
  },
  {
    title: "Personal Dashboard",
    description:
      "Combine profile, watchlist, likes, and diary into one custom view outside Interis.",
    icon: Zap,
    tone: "destructive",
  },
] as const;

export const publicSurface: readonly PublicEndpoint[] = [
  { method: "GET", path: "/api/public/:username/profile", description: "Public profile summary and core counts." },
  { method: "GET", path: "/api/public/:username/top4", description: "Featured top cinema and serial picks." },
  { method: "GET", path: "/api/public/:username/recent", description: "Short recent public activity stream." },
  { method: "GET", path: "/api/public/:username/reviews", description: "Public reviews with media context." },
  { method: "GET", path: "/api/public/:username/lists", description: "Public lists and list entries." },
  { method: "GET", path: "/api/public/:username/likes", description: "Public liked cinema and serial media." },
  { method: "GET", path: "/api/public/:username/watchlist", description: "Public watchlist items." },
  {
    method: "GET",
    path: "/api/public/:username/diary",
    description: "Public diary/log history for movie and serial entries.",
  },
  { method: "GET", path: "/api/public/:username/activity", description: "Broader public activity timeline." },
  {
    method: "GET",
    path: "/api/public/:username/movies/watched",
    description: "Watched movies (film-only).",
  },
  {
    method: "GET",
    path: "/api/public/:username/serials/:tmdbId",
    description: "Watch progress and stats for a specific serial.",
  },
  {
    method: "GET",
    path: "/api/public/:username/serials/currently-watching",
    description: "Serials started but not finished, most recently watched first.",
  },
  {
    method: "GET",
    path: "/api/public/:username/serials/watched",
    description: "Fully watched serials (series-only).",
  },
] as const;

export const codeExamples: readonly CodeExample[] = [
  {
    title: "Fetch profile (JavaScript)",
    language: "js",
    code: `const username = "your_username";

const res = await fetch(
  "/api/public/" + username + "/profile"
);

if (!res.ok) throw new Error("Profile not found");

const profile = await res.json();
console.log(profile.displayUsername, profile.stats.reviewCount);`,
  },
  {
    title: "Fetch top picks (curl)",
    language: "curl",
    code: `curl "https://api.interis.gorkemkaryol.dev/api/public/your_username/top4"`,
  },
  {
    title: "Tiny recent widget (React)",
    language: "tsx",
    code: `const [recent, setRecent] = useState([]);

useEffect(() => {
  fetch("/api/public/your_username/recent?limit=5")
    .then((res) => res.json())
    .then(setRecent);
}, []);

return (
  <ul>
    {recent.map((item) => (
      <li key={item.id}>{item.actor.username} • {item.kind}</li>
    ))}
  </ul>
);`,
  },
] as const;

export const toneToColor: Record<UseCaseTone, string> = {
  primary: "var(--primary)",
  cinema: "var(--module-cinema)",
  serial: "var(--module-serial)",
  destructive: "var(--destructive)",
};
