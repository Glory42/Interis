import { useState } from "react";
import { SentenceSelect, type SentenceOption } from "@/components/ui/SentenceSelect";
import type { MediaKind } from "@/features/media/cache/media-events";
import { tmdbImageUrl } from "@/lib/tmdb-image";
import { useNearViewport } from "@/lib/use-near-viewport";
import { cn } from "@/lib/utils";
import type { WatchProvider } from "./api";
import { groupWatchProviders } from "./group-watch-providers";
import { useWatchProviders } from "./use-watch-providers";
import { readWatchRegion, regionLabel, storeWatchRegion } from "./watch-region";

type WhereToWatchProps = {
  kind: MediaKind;
  tmdbId: number;
  // CSS colour of the region picker's underline, e.g. "var(--film)".
  accent: string;
  className?: string;
};

const ProviderLogo = ({ provider, href, groupLabel }: { provider: WatchProvider; href: string; groupLabel: string }) => {
  const logoUrl = tmdbImageUrl(provider.logoPath, "w92");
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={provider.name}
        aria-label={`${groupLabel} on ${provider.name}`}
        className="block size-10 overflow-hidden rounded-md border border-[color:var(--line)] transition-opacity hover:opacity-80"
      >
        {logoUrl ? (
          <img src={logoUrl} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <span className="mono-meta flex size-full items-center justify-center bg-[color:var(--surface)] text-muted-foreground">
            {provider.name.slice(0, 2)}
          </span>
        )}
      </a>
    </li>
  );
};

// Stream / Rent / Buy logos for one region, linking out to TMDB's watch page. Hidden when there are none.
export const WhereToWatch = ({ kind, tmdbId, accent, className }: WhereToWatchProps) => {
  const [region, setRegion] = useState(readWatchRegion);
  const [sentinelRef, isNearViewport] = useNearViewport<HTMLDivElement>();
  const { data } = useWatchProviders(kind, tmdbId, region, isNearViewport);

  const groups = data ? groupWatchProviders(data) : [];
  if (!data || groups.length === 0) {
    // Nothing to show yet: keep a zero-size marker so the block can tell when it's near the viewport.
    return isNearViewport ? null : <div ref={sentinelRef} aria-hidden />;
  }

  const regionOptions: SentenceOption<string>[] = [...new Set([...data.availableRegions, region])]
    .map((code) => ({ value: code, word: code, label: regionLabel(code) }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const href = data.link ?? `https://www.themoviedb.org/${kind === "film" ? "movie" : "tv"}/${tmdbId}/watch?locale=${region}`;

  const changeRegion = (next: string) => {
    setRegion(next);
    storeWatchRegion(next);
  };

  return (
    <section aria-labelledby={`where-to-watch-${tmdbId}`} className={cn("rounded-xl border border-[color:var(--line)] p-4", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 id={`where-to-watch-${tmdbId}`} className="kicker text-muted-foreground">
          Where to watch
        </h2>
        <span className="mono-meta text-muted-foreground">
          <SentenceSelect
            value={region}
            options={regionOptions}
            onChange={changeRegion}
            ariaLabel={`Region: ${regionLabel(region)}`}
            accent={accent}
          />
        </span>
      </div>

      {groups.map((group) => (
        <div key={group.key} className="mt-3">
          <p className="mono-meta text-muted-foreground uppercase">{group.label}</p>
          <ul aria-label={group.label} className="mt-1.5 flex flex-wrap gap-2">
            {group.providers.map((provider) => (
              <ProviderLogo key={provider.providerId} provider={provider} href={href} groupLabel={group.label} />
            ))}
          </ul>
        </div>
      ))}

      <p className="mono-meta mt-3 text-muted-foreground">
        Data by{" "}
        <a href="https://www.justwatch.com" target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-foreground hover:underline">
          JustWatch
        </a>
      </p>
    </section>
  );
};
