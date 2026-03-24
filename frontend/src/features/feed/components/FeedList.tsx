import { FeedItem } from "@/features/feed/components/FeedItem";

const placeholderActivities = [
  {
    label: "Phase 2 Feed Placeholder",
    detail: "Activity stream will render here once social routes are mounted.",
  },
  {
    label: "Denormalized Activities",
    detail: "Will read from the backend activities table through /api/social/feed.",
  },
] as const;

export const FeedList = () => {
  return (
    <div className="space-y-3">
      {placeholderActivities.map((activity) => (
        <FeedItem
          key={activity.label}
          label={activity.label}
          detail={activity.detail}
        />
      ))}
    </div>
  );
};
