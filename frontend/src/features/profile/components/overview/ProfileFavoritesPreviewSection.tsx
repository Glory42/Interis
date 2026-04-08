import { BookOpen, Film, Headphones, Tv } from "lucide-react";
import type { UserTopPickCategory, UserTopPicks } from "@/features/profile/api";
import { ProfileFavoritesCategoryPanel } from "./ProfileFavoritesCategoryPanel";

type ProfileFavoritesPreviewSectionProps = {
  topPicks: UserTopPicks | null;
  isTopPicksPending: boolean;
  isTopPicksError: boolean;
};

const resolvePanelState = (
  category: UserTopPickCategory | undefined,
  itemCount: number,
  isPending: boolean,
  isError: boolean,
) => {
  if (category && !category.supported) {
    return "unsupported" as const;
  }

  if (itemCount > 0) {
    return "ready" as const;
  }

  if (isPending) {
    return "loading" as const;
  }

  if (isError) {
    return "error" as const;
  }

  return "empty" as const;
};

export const ProfileFavoritesPreviewSection = ({
  topPicks,
  isTopPicksPending,
  isTopPicksError,
}: ProfileFavoritesPreviewSectionProps) => {
  const categories = topPicks?.categories ?? [];

  const cinemaCategory = categories.find((category) => category.key === "cinema");
  const serialCategory = categories.find((category) => category.key === "serial");
  const codexCategory = categories.find((category) => category.key === "codex");
  const echoesCategory = categories.find((category) => category.key === "echoes");

  const cinemaItems = (cinemaCategory?.items ?? [])
    .slice(0, 4)
    .map((item) => item.title)
    .filter((title): title is string => Boolean(title));

  const serialItems = (serialCategory?.items ?? [])
    .slice(0, 4)
    .map((item) => item.title)
    .filter((title): title is string => Boolean(title));

  return (
    <section className="space-y-3">
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] profile-shell-accent">
        Favorites Preview
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ProfileFavoritesCategoryPanel
          title="Cinema"
          icon={Film}
          state={resolvePanelState(
            cinemaCategory,
            cinemaItems.length,
            isTopPicksPending,
            isTopPicksError,
          )}
          items={cinemaItems}
          accentColor="var(--module-cinema)"
          emptyText="No cinema favorites selected yet."
          errorText="Could not load cinema favorites."
        />

        <ProfileFavoritesCategoryPanel
          title="Serial"
          icon={Tv}
          state={resolvePanelState(
            serialCategory,
            serialItems.length,
            isTopPicksPending,
            isTopPicksError,
          )}
          items={serialItems}
          accentColor="var(--module-serial)"
          emptyText="No serial favorites selected yet."
          errorText="Could not load serial favorites."
          unsupportedText="Serial favorites are not configurable yet."
        />

        <ProfileFavoritesCategoryPanel
          title="Codex"
          icon={BookOpen}
          state={resolvePanelState(codexCategory, 0, isTopPicksPending, isTopPicksError)}
          accentColor="var(--module-codex)"
          unsupportedText="Codex favorites are not backed by a profile API yet."
        />

        <ProfileFavoritesCategoryPanel
          title="Echoes"
          icon={Headphones}
          state={resolvePanelState(echoesCategory, 0, isTopPicksPending, isTopPicksError)}
          accentColor="var(--module-echoes)"
          unsupportedText="Echoes favorites are not backed by a profile API yet."
        />
      </div>
    </section>
  );
};
