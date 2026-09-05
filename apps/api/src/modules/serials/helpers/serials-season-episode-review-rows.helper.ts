import { parseEpisodeMediaSourceId, parseSeasonMediaSourceId } from "./serials-media-source.helper";
import {
  TV_EPISODE_REVIEW_TYPE,
  TV_SEASON_REVIEW_TYPE,
} from "../../reviews/constants/review-media-type.constant";

type SeasonEpisodeReviewLike = { mediaType: string; mediaSourceId: string };

export type ParsedSeasonReviewRow<TRow> = TRow & {
  parsed: { tmdbId: number; seasonNumber: number };
};

export type ParsedEpisodeReviewRow<TRow> = TRow & {
  parsed: { tmdbId: number; seasonNumber: number; episodeNumber: number };
};

// Season/episode reviews are stored as ordinary rows in the shared reviews
// table, keyed by a compound mediaSourceId ("{tmdbId}:{season}[:{episode}]")
// instead of a foreign key - both the series detail page's review list
// (SerialsSeasonEpisodeReviewsRepository) and the social feed's serial
// review rows (SocialFeedSerialReviewRepository) need to split a batch of
// these rows into parsed season/episode groups before they can resolve each
// review's rating. That split was duplicated byte-for-byte in both
// repositories; this is the one implementation both call.
export function splitSeasonEpisodeReviewRows<TRow extends SeasonEpisodeReviewLike>(
  rows: TRow[],
): {
  seasonRows: ParsedSeasonReviewRow<TRow>[];
  episodeRows: ParsedEpisodeReviewRow<TRow>[];
} {
  const seasonRows = rows
    .filter((row) => row.mediaType === TV_SEASON_REVIEW_TYPE)
    .map((row) => ({ ...row, parsed: parseSeasonMediaSourceId(row.mediaSourceId) }))
    .filter(
      (row): row is ParsedSeasonReviewRow<TRow> => row.parsed !== null,
    );

  const episodeRows = rows
    .filter((row) => row.mediaType === TV_EPISODE_REVIEW_TYPE)
    .map((row) => ({ ...row, parsed: parseEpisodeMediaSourceId(row.mediaSourceId) }))
    .filter(
      (row): row is ParsedEpisodeReviewRow<TRow> => row.parsed !== null,
    );

  return { seasonRows, episodeRows };
}
