import { FollowSuggestionList } from "@/features/social/components/FollowSuggestionList";

export const FEED_SUGGESTIONS_LIMIT = 8;

// The Following Feed is empty until you follow someone; this is the way in.
export const FindPeopleSection = () => (
  <section aria-labelledby="find-people-heading" className="mb-6 overflow-hidden rounded-[3px] border border-[color:var(--line)]">
    <div className="slate mono-meta uppercase">
      <span id="find-people-heading">Find people to follow</span>
      <span>By taste</span>
    </div>
    <div className="px-4 pt-2 pb-1">
      <p className="body-s pt-1 text-muted-foreground">
        You're not following anyone yet. These people watch what you watch.
      </p>
      <FollowSuggestionList limit={FEED_SUGGESTIONS_LIMIT} />
    </div>
  </section>
);
