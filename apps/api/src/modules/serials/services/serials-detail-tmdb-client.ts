import {
  getSeriesAggregateCredits,
  getSeriesDetails,
  getSimilarSeries,
} from "../../../infrastructure/tmdb/serials";

// The seam SerialsDetailService.gather() reads TMDB through. Mirrors
// movies-detail-tmdb-client.ts: production code never constructs this
// explicitly (getDetail() defaults to defaultSerialsDetailTmdbClient
// below), but a test can pass a fake client through getDetail()'s public
// interface to drive gather()'s TMDB-down / partial-failure branches.
export type SerialsDetailTmdbClient = {
  getDetails: typeof getSeriesDetails;
  getAggregateCredits: typeof getSeriesAggregateCredits;
  getSimilar: typeof getSimilarSeries;
};

export const defaultSerialsDetailTmdbClient: SerialsDetailTmdbClient = {
  getDetails: getSeriesDetails,
  getAggregateCredits: getSeriesAggregateCredits,
  getSimilar: getSimilarSeries,
};
