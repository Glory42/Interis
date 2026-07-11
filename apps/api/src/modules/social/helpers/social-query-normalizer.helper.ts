import { parseIntParam } from "../../../commons/helpers/parse-int-param.helper";

export const normalizeSocialFeedLimit = (limit: unknown, fallback = 20): number =>
  parseIntParam(limit, fallback);
