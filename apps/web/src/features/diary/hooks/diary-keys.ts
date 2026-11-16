export const diaryKeys = {
  all: ["diary"] as const,
  myLogs: ["diary", "my-logs"] as const,
  // The owner-only note and tags of one log.
  privateFields: (kind: "film" | "tv", logId: string) => ["diary", "private", kind, logId] as const,
};
