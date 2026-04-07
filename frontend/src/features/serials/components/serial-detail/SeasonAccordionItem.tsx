import { ChevronDown, ChevronUp } from "lucide-react";
import type { SerialDetailResponse } from "@/features/serials/api";
import { getStillUrl } from "@/features/serials/components/utils";
import { useSeriesSeasonDetail } from "@/features/serials/hooks/useSerials";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-detail/styles";
import {
  toDateLabel,
  toEpisodeCodeLabel,
  toYearFromDateLabel,
} from "@/features/serials/components/serial-detail/utils";

type SeasonAccordionItemProps = {
  tmdbId: number;
  season: SerialDetailResponse["series"]["seasons"][number];
  isOpen: boolean;
  onToggle: () => void;
};

export const SeasonAccordionItem = ({
  tmdbId,
  season,
  isOpen,
  onToggle,
}: SeasonAccordionItemProps) => {
  const seasonDetailQuery = useSeriesSeasonDetail(
    tmdbId,
    season.seasonNumber,
    isOpen,
  );

  const episodes = seasonDetailQuery.data?.episodes ?? [];

  return (
    <div
      className="overflow-hidden border"
      style={{
        borderColor: SERIAL_MODULE_STYLES.border,
        background: SERIAL_MODULE_STYLES.panel,
      }}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-7 w-7 items-center justify-center"
            style={{ background: SERIAL_MODULE_STYLES.panelStrong }}
          >
            <span
              className="font-mono text-[11px]"
              style={{ color: SERIAL_MODULE_STYLES.accent }}
            >
              {season.seasonNumber}
            </span>
          </div>

          <div>
            <p
              className="font-mono text-xs font-bold"
              style={{ color: SERIAL_MODULE_STYLES.text }}
            >
              {season.name || `Season ${season.seasonNumber}`}
            </p>
            <p
              className="font-mono text-[10px]"
              style={{ color: SERIAL_MODULE_STYLES.muted }}
            >
              {season.episodeCount ?? "?"} episodes ·{" "}
              {toYearFromDateLabel(season.airDate)}
            </p>
          </div>
        </div>

        {isOpen ? (
          <ChevronUp
            className="h-4 w-4"
            style={{ color: SERIAL_MODULE_STYLES.accent }}
          />
        ) : (
          <ChevronDown
            className="h-4 w-4"
            style={{ color: SERIAL_MODULE_STYLES.accent }}
          />
        )}
      </button>

      {isOpen ? (
        <div
          className="border-t"
          style={{ borderColor: SERIAL_MODULE_STYLES.borderSoft }}
        >
          {seasonDetailQuery.isPending ? (
            <div
              className="px-4 py-3 font-mono text-xs"
              style={{ color: SERIAL_MODULE_STYLES.muted }}
            >
              Loading episodes...
            </div>
          ) : null}

          {seasonDetailQuery.isError ? (
            <div
              className="px-4 py-3 font-mono text-xs text-destructive"
              style={{
                background:
                  "color-mix(in srgb, var(--destructive) 10%, transparent)",
              }}
            >
              Could not load episodes for this season.
            </div>
          ) : null}

          {!seasonDetailQuery.isPending &&
          !seasonDetailQuery.isError &&
          episodes.length === 0 ? (
            <div
              className="px-4 py-3 font-mono text-xs"
              style={{ color: SERIAL_MODULE_STYLES.muted }}
            >
              No episodes available for this season.
            </div>
          ) : null}

          {!seasonDetailQuery.isPending &&
          !seasonDetailQuery.isError &&
          episodes.length > 0
            ? episodes.map((episode, index) => (
                <article
                  key={`episode-${episode.id}`}
                  className={`grid grid-cols-[104px_minmax(0,1fr)] gap-3 p-3 ${
                    index > 0 ? "border-t" : ""
                  }`}
                  style={{
                    borderColor: SERIAL_MODULE_STYLES.borderSoft,
                    background:
                      index % 2 === 0
                        ? "transparent"
                        : "color-mix(in srgb, var(--module-serial) 4%, transparent)",
                  }}
                >
                  <div
                    className="relative aspect-video overflow-hidden border"
                    style={{
                      borderColor: SERIAL_MODULE_STYLES.borderSoft,
                      background: SERIAL_MODULE_STYLES.panelSoft,
                    }}
                  >
                    <img
                      alt={episode.name}
                      className="h-full w-full object-cover"
                      src={getStillUrl(episode.stillPath)}
                    />

                    {episode.runtimeLabel ? (
                      <span className="absolute bottom-1 right-1 bg-black/65 px-1.5 py-0.5 font-mono text-[9px] text-white/85">
                        {episode.runtimeLabel}
                      </span>
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className="font-mono text-[10px]"
                        style={{ color: SERIAL_MODULE_STYLES.faint }}
                      >
                        {toEpisodeCodeLabel(episode.episodeNumber)}
                      </span>
                      <h4
                        className="truncate font-mono text-xs font-bold"
                        style={{ color: SERIAL_MODULE_STYLES.text }}
                      >
                        {episode.name}
                      </h4>
                    </div>

                    <p
                      className="line-clamp-2 text-xs leading-relaxed"
                      style={{ color: SERIAL_MODULE_STYLES.muted }}
                    >
                      {episode.overview ||
                        "No synopsis available for this episode."}
                    </p>

                    <p
                      className="mt-1.5 font-mono text-[10px]"
                      style={{ color: SERIAL_MODULE_STYLES.faint }}
                    >
                      {toDateLabel(episode.airDate) ?? "Air date unknown"}
                    </p>
                  </div>
                </article>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
};
