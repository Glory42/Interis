import type { CONTRIBUTION_MEDIA_TYPES } from "../constants/public-contributions.constants";

export type ContributionMediaType = (typeof CONTRIBUTION_MEDIA_TYPES)[number];

export type ContributionMediaCounts = Record<ContributionMediaType, number>;

export type PublicContributionDay = {
  date: string;
  totalCount: number;
  logCount: number;
  reviewCount: number;
  mediaCounts: ContributionMediaCounts;
  mediaMask: number;
};

export type PublicContributionsResponse = {
  window: {
    startDate: string;
    endDate: string;
    days: number;
    weekStartsOn: "sunday";
    timezone: "UTC";
  };
  totals: {
    contributions: number;
    activeDays: number;
    logs: number;
    reviews: number;
    mediaCounts: ContributionMediaCounts;
  };
  days: PublicContributionDay[];
};
