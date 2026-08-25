import { Link } from "@tanstack/react-router";
import { Music } from "lucide-react";
import type { MusicArchiveItem } from "@/features/music/api";
import { MUSIC_MODULE_STYLES } from "@/features/music/components/music-archive/constants";

type GridAlbumCardProps = {
  album: MusicArchiveItem;
};

export const GridAlbumCard = ({ album }: GridAlbumCardProps) => {
  const stateLabel = album.viewerHasLogged ? "Listened" : album.viewerWantToListen ? "Queue" : null;

  return (
    <Link
      to="/music/$mbid"
      params={{ mbid: album.mbid }}
      className="block w-full text-left"
      viewTransition
    >
      <div
        className="relative mb-3 aspect-square overflow-hidden border transition-colors"
        style={{
          borderColor: MUSIC_MODULE_STYLES.border,
          background: MUSIC_MODULE_STYLES.panel,
        }}
      >
        {album.coverArtUrl ? (
          <img
            src={album.coverArtUrl}
            alt={`${album.title} cover`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-2"
            style={{ background: MUSIC_MODULE_STYLES.panelSoft }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center"
              style={{ background: MUSIC_MODULE_STYLES.panelStrong }}
            >
              <Music className="h-4 w-4" style={{ color: MUSIC_MODULE_STYLES.accent }} />
            </div>
            <span
              className="font-mono text-[8px] uppercase tracking-[0.22em]"
              style={{ color: MUSIC_MODULE_STYLES.faint }}
            >
              No Art
            </span>
          </div>
        )}

        {stateLabel ? (
          <div className="absolute right-2 top-2">
            <span
              className="border px-2 py-0.5 font-mono text-[9px] tracking-[0.16em]"
              style={{
                borderColor: MUSIC_MODULE_STYLES.accent,
                color: MUSIC_MODULE_STYLES.accent,
                background: MUSIC_MODULE_STYLES.badge,
              }}
            >
              {stateLabel}
            </span>
          </div>
        ) : null}

        {album.avgRating !== null ? (
          <div className="absolute bottom-2 right-2">
            <span
              className="border px-2 py-0.5 font-mono text-[9px]"
              style={{
                borderColor: MUSIC_MODULE_STYLES.accent,
                color: MUSIC_MODULE_STYLES.accent,
                background: MUSIC_MODULE_STYLES.badge,
              }}
            >
              {album.avgRating.toFixed(1)}
            </span>
          </div>
        ) : null}
      </div>

      <p
        className="truncate font-mono text-[11px] leading-tight"
        style={{ color: MUSIC_MODULE_STYLES.text }}
      >
        {album.title}
      </p>
      <p
        className="truncate font-mono text-[10px]"
        style={{ color: MUSIC_MODULE_STYLES.muted }}
      >
        <span>{album.artistName}</span>
        {album.firstReleaseYear ? (
          <span style={{ color: MUSIC_MODULE_STYLES.faint }}> · {album.firstReleaseYear}</span>
        ) : null}
      </p>
    </Link>
  );
};
