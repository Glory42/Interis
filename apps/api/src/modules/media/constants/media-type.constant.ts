// The one source of truth for which media types this app knows about.
// Every mediaType union/enum elsewhere (ReviewMediaType, FeedMediaType,
// z.enum(["movie", "tv"]) DTOs, etc.) aliases or derives from this - adding
// a new media type means changing MEDIA_TYPES here and letting the compiler
// point at every switch/branch that needs to handle it, instead of hunting
// down independently-typed duplicates by hand.
export const MEDIA_TYPES = ["movie", "tv", "album", "book"] as const;

export type MediaType = (typeof MEDIA_TYPES)[number];
