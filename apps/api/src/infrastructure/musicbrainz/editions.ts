import type { IArtistCredit, IRelease, IReleaseGroup } from "musicbrainz-api";
import { mbApi } from "./client";

export type MBReleaseStub = {
  mbid: string;
  title: string;
  status: string | null;
  packaging: string | null;
  country: string | null;
  date: string | null;
  disambiguation: string | null;
};

const buildArtistCreditName = (credits: IArtistCredit[] | undefined): string => {
  return (
    (credits ?? []).map((c) => c.name + (c.joinphrase ?? "")).join("") || "Unknown Artist"
  );
};

export const parseReleaseYear = (date: string | null): number | null => {
  if (!date) return null;
  const year = Number.parseInt(date.slice(0, 4), 10);
  return Number.isNaN(year) ? null : year;
};

// Lightweight per-release metadata for every Edition of a release-group -
// no tracklist yet (that's a separate, per-edition lookup - see
// getReleaseTracklist). Fetching every release's full tracklist eagerly
// here would mean dozens of MusicBrainz calls (rate-limited to ~1/sec) for
// a single album view.
export const getReleasesForReleaseGroup = async (
  releaseGroupMbid: string,
): Promise<MBReleaseStub[]> => {
  const rg = (await mbApi.lookup("release-group", releaseGroupMbid, [
    "releases",
  ])) as IReleaseGroup;

  return (rg.releases ?? []).map((release) => ({
    mbid: release.id,
    title: release.title,
    status: release.status ?? null,
    packaging: release.packaging ?? null,
    country: release.country ?? null,
    date: release.date ?? null,
    disambiguation: release.disambiguation || null,
  }));
};

export type MBTrackStub = {
  recordingMbid: string;
  title: string;
  artistName: string;
  length: number | null;
  disambiguation: string | null;
  discNumber: number;
  position: number;
};

export type MBReleaseTracklist = {
  format: string | null;
  trackCount: number;
  tracks: MBTrackStub[];
};

export const getReleaseTracklist = async (releaseMbid: string): Promise<MBReleaseTracklist> => {
  const release = (await mbApi.lookup("release", releaseMbid, [
    "media",
    "recordings",
    "artist-credits",
  ])) as IRelease;

  const media = release.media ?? [];
  const tracks: MBTrackStub[] = [];

  media.forEach((medium, mediumIndex) => {
    for (const track of medium.tracks ?? []) {
      tracks.push({
        recordingMbid: track.recording.id,
        title: track.recording.title,
        artistName: buildArtistCreditName(track.recording["artist-credit"]),
        length: track.length ?? track.recording.length ?? null,
        disambiguation: track.recording.disambiguation || null,
        discNumber: medium.position ?? mediumIndex + 1,
        position: Number.parseInt(track.number, 10) || track.position,
      });
    }
  });

  return {
    format: media[0]?.format ?? null,
    trackCount: media.reduce((sum, m) => sum + (m["track-count"] ?? 0), 0),
    tracks,
  };
};
