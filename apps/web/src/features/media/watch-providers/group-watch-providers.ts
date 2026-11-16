import type { WatchProvider, WatchProviders } from "./api";

export type WatchProviderGroup = {
  key: "stream" | "rent" | "buy";
  label: string;
  providers: WatchProvider[];
};

// Subscription, free and with-ads all read as "Stream"; a service listed twice shows once.
const mergeProviders = (lists: WatchProvider[][]): WatchProvider[] => {
  const byId = new Map<number, WatchProvider>();
  for (const provider of lists.flat()) {
    const existing = byId.get(provider.providerId);
    if (!existing || provider.displayPriority < existing.displayPriority) byId.set(provider.providerId, provider);
  }
  return [...byId.values()].sort((a, b) => a.displayPriority - b.displayPriority);
};

// Stream / Rent / Buy, leaving out any group with nothing in it.
export const groupWatchProviders = (data: WatchProviders): WatchProviderGroup[] =>
  (
    [
      { key: "stream", label: "Stream", providers: mergeProviders([data.flatrate, data.free, data.ads]) },
      { key: "rent", label: "Rent", providers: mergeProviders([data.rent]) },
      { key: "buy", label: "Buy", providers: mergeProviders([data.buy]) },
    ] satisfies WatchProviderGroup[]
  ).filter((group) => group.providers.length > 0);
