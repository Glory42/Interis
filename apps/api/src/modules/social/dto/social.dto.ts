export type FeedQueryDto = {
  limit?: string;
  cursor?: string;
  mediaType?: string;
  // The viewer's IANA time zone, e.g. "Europe/Istanbul".
  tz?: string;
};

export type UsernameParamsDto = {
  username: string;
};
