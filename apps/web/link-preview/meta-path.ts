const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TMDB_ID = /^[1-9][0-9]{0,9}$/;
const SEASON = /^[0-9]{1,3}$/;
const SLUG = /^[a-z0-9-]{1,200}$/i;
const USERNAME = /^[^/]{1,64}$/;
const YEAR = /^(19|20)[0-9]{2}$/;

const decode = (segment: string): string | null => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
};

const enc = encodeURIComponent;

// The API meta path (under /api/public/meta) for a shareable web page, or null for any
// other page. Mirrors the routes in apps/web/src/routes.
export const metaPathFor = (pathname: string): string | null => {
  const segments = pathname.replace(/\/+$/, "").split("/").slice(1).map(decode);
  if (segments.some((segment) => segment === null || segment === "")) return null;
  const [section, first, second, third] = segments as string[];
  const count = segments.length;

  switch (section) {
    case "reviews":
      return count === 3 && USERNAME.test(first) && UUID.test(second) ? `/review/${enc(first)}/${second}` : null;
    case "profile":
      if (count < 2 || !USERNAME.test(first)) return null;
      if (second === "lists" && third && UUID.test(third)) return `/list/${third}`;
      if (second === "year" && count === 4 && YEAR.test(third)) return `/recap/${enc(first)}/${third}`;
      return `/profile/${enc(first)}`;
    case "recap":
      return count === 3 && USERNAME.test(first) && YEAR.test(second)
        ? `/recap/${enc(first)}/${second}`
        : null;
    case "movies":
      return count === 2 && TMDB_ID.test(first) ? `/movie/${first}` : null;
    case "serials":
      if (!first || !TMDB_ID.test(first)) return null;
      if (count === 2) return `/serial/${first}`;
      return count === 4 && second === "season" && SEASON.test(third) ? `/serial/${first}/season/${Number(third)}` : null;
    case "actor":
    case "director":
      return count === 2 && SLUG.test(first) ? `/person/${section}/${first.toLowerCase()}` : null;
    default:
      return null;
  }
};
