import { env } from "../../../infrastructure/config/env";

// Logged-out movie/serial detail responses are identical for every viewer, so they're
// shared from memory briefly - repeat bot/anonymous hits then don't touch the DB.
// Off under test so integration suites see their own writes immediately.
export const ANONYMOUS_DETAIL_CACHE_TTL_MS = env.NODE_ENV === "test" ? 0 : 60_000;
export const ANONYMOUS_DETAIL_CACHE_MAX_ENTRIES = 300;
