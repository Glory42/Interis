export type InteractionStateInput = {
  liked?: boolean;
  watchlisted?: boolean;
  rating?: number | null;
  watched?: boolean;
};

export type InteractionStateRow = {
  liked: boolean;
  watchlisted: boolean;
  rating: number | null;
  isWatched: boolean;
};

export type ResolvedInteractionUpdate = {
  insertValues: InteractionStateRow;
  updateSet: Partial<InteractionStateRow>;
};

// Liking, rating, or marking watched implies the media is no longer "to
// watch" - auto-clear watchlisted alongside it, unless the caller sent an
// explicit watchlisted value in the same request (that always wins). Shared
// by every write to interaction state - setWatchlisted/setRating/markWatched
// are all sugar over this same resolution, so the rule can't drift between
// the "one field at a time" callers and the "several fields at once" PUT
// endpoint.
//
// Insert-vs-conflict asymmetry is intentional, carried over from the
// pre-unification implementation: a brand-new row prefers the explicit
// `watched` flag over the implicit-watch signal, but an update to an
// existing row lets the implicit-watch signal win over an explicit
// `watched` value.
export function resolveInteractionUpdate(input: InteractionStateInput): ResolvedInteractionUpdate {
  const isImplicitlyWatched =
    input.liked === true || (input.rating !== undefined && input.rating !== null);

  const shouldAutoClearWatchlist =
    input.watchlisted === undefined &&
    (input.liked === true || input.watched === true || isImplicitlyWatched);

  const insertValues: InteractionStateRow = {
    liked: input.liked ?? false,
    watchlisted: input.watchlisted ?? false,
    rating: input.rating ?? null,
    isWatched: input.watched ?? isImplicitlyWatched ?? false,
  };

  const updateSet: Partial<InteractionStateRow> = {
    ...(input.liked !== undefined && { liked: input.liked }),
    ...(input.watchlisted !== undefined && { watchlisted: input.watchlisted }),
    ...(shouldAutoClearWatchlist && { watchlisted: false }),
    ...(input.rating !== undefined && { rating: input.rating ?? null }),
    ...(input.watched !== undefined && { isWatched: input.watched }),
    ...(isImplicitlyWatched && { isWatched: true }),
  };

  return { insertValues, updateSet };
}
