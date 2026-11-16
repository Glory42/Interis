// Cards are served as JPEG under /api/public/og/<kind>/<id>.jpg (older .png URLs redirect).
export const SHARE_CARD_CONTENT_TYPE = "image/jpeg";
export const SHARE_CARD_EXTENSION = "jpg";

// A rendered card; `complete` is false when some artwork couldn't be fetched.
export type ShareCard = { image: Buffer; complete: boolean };
