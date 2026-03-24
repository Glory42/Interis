export type FeedActivity = {
  id: string;
  summary: string;
  createdAt: string;
};

export const getFeedActivities = async (): Promise<FeedActivity[]> => {
  return [];
};
