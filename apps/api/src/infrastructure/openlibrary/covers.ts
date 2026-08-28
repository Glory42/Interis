// Open Library serves a generic placeholder image with a 200 for any ISBN
// unless `default=false` is passed, in which case a missing cover 404s -
// that's the only reliable way to tell "has a real cover" from "doesn't".
// The returned URL omits that param so the actual image loads normally.
const coverCheckUrl = (isbn13: string) =>
  `https://covers.openlibrary.org/b/isbn/${isbn13}-L.jpg?default=false`;

const coverDisplayUrl = (isbn13: string) => `https://covers.openlibrary.org/b/isbn/${isbn13}-L.jpg`;

export const findCoverUrl = async (isbn13: string): Promise<string | null> => {
  const response = await fetch(coverCheckUrl(isbn13), { method: "HEAD" });
  if (!response.ok) {
    return null;
  }
  return coverDisplayUrl(isbn13);
};
