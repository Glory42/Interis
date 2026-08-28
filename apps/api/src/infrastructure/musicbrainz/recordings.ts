import type { IRecording } from "musicbrainz-api";
import { mbApi } from "./client";

export type MBRecordingDetail = {
  mbid: string;
  title: string;
  artistName: string;
  length: number | null;
  disambiguation: string | null;
};

const buildArtistCreditName = (
  credits: IRecording["artist-credit"] | undefined,
): string => {
  return (credits ?? []).map((c) => c.name + (c.joinphrase ?? "")).join("") || "Unknown Artist";
};

// Standalone recording lookup - used when a Track is reached (e.g. via a
// shared review link) before any Edition's tracklist has been cached, so
// the row doesn't exist in the DB yet from that path.
export const getRecordingDetail = async (recordingMbid: string): Promise<MBRecordingDetail> => {
  const recording = (await mbApi.lookup("recording", recordingMbid, [
    "artist-credits",
  ])) as IRecording;

  return {
    mbid: recording.id,
    title: recording.title,
    artistName: buildArtistCreditName(recording["artist-credit"]),
    length: recording.length ?? null,
    disambiguation: recording.disambiguation || null,
  };
};
