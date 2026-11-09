import { peekViewerUserIdFromHeaders } from "../../../commons/auth/session-resolver.helper";
import { env } from "../../../infrastructure/config/env";
import { createPublicResponseCache } from "../../public/helpers/public-response-cache.helper";

// Same 5-minute cache as the widget API, except the Profile owner always bypasses it.
// Disabled under test so integration suites see their own writes.
export const createProfileTabsCache = () =>
  createPublicResponseCache({
    ttlMs: env.NODE_ENV === "test" ? 0 : 5 * 60 * 1000,
    maxEntries: 500,
    resolveViewerId: (req) => peekViewerUserIdFromHeaders(req.headers),
  });
