import { useState } from "react";
import { Disc3 } from "lucide-react";
import { useAlbumEditions, useEditionTracklist } from "@/features/music/hooks/useMusic";
import { MUSIC_MODULE_STYLES } from "@/features/music/components/music-detail/styles";

type AlbumEditionsSectionProps = {
  mbid: string;
};

const formatDurationLabel = (lengthMs: number | null): string => {
  if (lengthMs === null) return "--:--";
  const totalSeconds = Math.round(lengthMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const EditionTracklist = ({ editionMbid }: { editionMbid: string }) => {
  const tracklistQuery = useEditionTracklist(editionMbid, true);

  if (tracklistQuery.isPending) {
    return (
      <p className="px-3 py-3 font-mono text-[11px]" style={{ color: MUSIC_MODULE_STYLES.muted }}>
        Loading tracklist...
      </p>
    );
  }

  if (tracklistQuery.isError || !tracklistQuery.data) {
    return (
      <p className="px-3 py-3 font-mono text-[11px]" style={{ color: MUSIC_MODULE_STYLES.muted }}>
        Could not load this edition's tracklist.
      </p>
    );
  }

  return (
    <ul className="space-y-1 px-3 pb-3">
      {tracklistQuery.data.tracks.map((track) => (
        <li
          key={track.mbid}
          className="flex items-center justify-between gap-3 font-mono text-[11px]"
          style={{ color: MUSIC_MODULE_STYLES.text }}
        >
          <span className="truncate">
            <span style={{ color: MUSIC_MODULE_STYLES.faint }}>{track.position}.</span>{" "}
            {track.title}
          </span>
          <span className="shrink-0" style={{ color: MUSIC_MODULE_STYLES.faint }}>
            {formatDurationLabel(track.length)}
          </span>
        </li>
      ))}
    </ul>
  );
};

export const AlbumEditionsSection = ({ mbid }: AlbumEditionsSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEditionMbid, setSelectedEditionMbid] = useState<string | null>(null);

  const editionsQuery = useAlbumEditions(mbid, isOpen);

  if (!isOpen) {
    return (
      <div className="mb-8">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors"
          style={{ borderColor: MUSIC_MODULE_STYLES.border, color: MUSIC_MODULE_STYLES.muted }}
        >
          <Disc3 className="h-3 w-3" />
          Show Editions
        </button>
      </div>
    );
  }

  return (
    <div
      className="mb-8 border-y py-5"
      style={{ borderColor: MUSIC_MODULE_STYLES.borderSoft }}
    >
      <p
        className="mb-3 font-mono text-[9px] uppercase tracking-[0.22em]"
        style={{ color: MUSIC_MODULE_STYLES.faint }}
      >
        Editions
      </p>

      {editionsQuery.isPending ? (
        <p className="font-mono text-xs" style={{ color: MUSIC_MODULE_STYLES.muted }}>
          Loading editions...
        </p>
      ) : null}

      {editionsQuery.isError ? (
        <p className="font-mono text-xs" style={{ color: MUSIC_MODULE_STYLES.muted }}>
          Could not load this album's editions.
        </p>
      ) : null}

      {editionsQuery.data ? (
        <div className="space-y-2">
          {editionsQuery.data.editions.map((edition) => {
            const isSelected = selectedEditionMbid === edition.mbid;
            return (
              <div key={edition.mbid} style={{ borderColor: MUSIC_MODULE_STYLES.border }}>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedEditionMbid((current) =>
                      current === edition.mbid ? null : edition.mbid,
                    )
                  }
                  className="flex w-full items-center justify-between gap-3 border px-3 py-2 text-left font-mono text-[11px] transition-colors"
                  style={{
                    borderColor: isSelected
                      ? MUSIC_MODULE_STYLES.accent
                      : MUSIC_MODULE_STYLES.border,
                    color: MUSIC_MODULE_STYLES.text,
                    background: isSelected ? MUSIC_MODULE_STYLES.panelSoft : "transparent",
                  }}
                >
                  <span className="truncate">
                    {edition.title}
                    {edition.disambiguation ? (
                      <span style={{ color: MUSIC_MODULE_STYLES.faint }}>
                        {" "}
                        ({edition.disambiguation})
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0" style={{ color: MUSIC_MODULE_STYLES.faint }}>
                    {[edition.releaseYear, edition.country].filter(Boolean).join(" · ") ||
                      "Unknown"}
                  </span>
                </button>

                {isSelected ? (
                  <div className="border border-t-0" style={{ borderColor: MUSIC_MODULE_STYLES.border }}>
                    <EditionTracklist editionMbid={edition.mbid} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
