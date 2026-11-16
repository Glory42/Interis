export type WatchProvider = {
  providerId: number;
  name: string;
  logoPath: string | null;
  displayPriority: number;
};

// One region's availability for a Film or Series, plus every region that has any.
export type WatchProvidersResult = {
  region: string;
  link: string | null;
  flatrate: WatchProvider[];
  free: WatchProvider[];
  ads: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
  availableRegions: string[];
};
