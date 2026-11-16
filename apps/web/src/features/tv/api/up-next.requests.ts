import { apiRequest, type QueryRequestOptions } from "@/lib/api-client";
import { viewerTimeZone } from "@/lib/time";
import { upNextResponseSchema, type UpNextResponse } from "./schemas";

// The viewer's zone decides which day is "today" for aired / airing soon.
export const getUpNext = async (options: QueryRequestOptions = {}): Promise<UpNextResponse> => {
  const response = await apiRequest<unknown>(`/api/serials/up-next?tz=${encodeURIComponent(viewerTimeZone())}`, {
    method: "GET",
    signal: options.signal,
  });

  return upNextResponseSchema.parse(response);
};
