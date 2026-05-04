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
  { path: "/api/public/:username/profile", description: "Public profile summary and core counts." },
  { path: "/api/public/:username/top4", description: "Featured top cinema and serial picks." },
  { path: "/api/public/:username/recent", description: "Short recent public activity stream." },
  { path: "/api/public/:username/reviews", description: "Public reviews with media context." },
  { path: "/api/public/:username/lists", description: "Public lists and list entries." },
  { path: "/api/public/:username/likes", description: "Public liked cinema and serial media." },
  { path: "/api/public/:username/watchlist", description: "Public watchlist items." },
  {
    path: "/api/public/:username/diary",
    description: "Public diary/log history for movie and serial entries.",
  },
  { path: "/api/public/:username/activity", description: "Broader public activity timeline." },
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
    code: `curl "https://your-interis-domain.com/api/public/your_username/top4"`,
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

export const uiColors = {
  border: "color-mix(in srgb, var(--primary) 22%, var(--border) 78%)",
  rowBorder: "color-mix(in srgb, var(--primary) 12%, var(--border) 88%)",
  shellBackground: "color-mix(in srgb, var(--background) 88%, black)",
  panelBackground: "color-mix(in srgb, var(--card) 76%, var(--background) 24%)",
  mutedText: "color-mix(in srgb, var(--foreground) 58%, transparent)",
  dimText: "color-mix(in srgb, var(--foreground) 34%, transparent)",
} as const;
