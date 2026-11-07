import { Link } from "@tanstack/react-router";
import { CreditsList } from "@/components/film/CreditsList";
import type { ReviewDetail } from "@/features/reviews/api";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const toDayLabel = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : `${WEEKDAYS[date.getDay()]} ${MONTHS[date.getMonth()]} ${date.getDate()}`;
};

// The review's facts as one credits block, plus the way to the title itself.
export const ProfileReviewSidebar = ({ detail }: { detail: ReviewDetail }) => {
  const isTv = detail.mediaType === "tv";
  return (
    <aside className="space-y-4 lg:col-span-4">
      <section aria-label="Credits">
        <p className="kicker text-muted-foreground">Credits</p>
        <CreditsList
          className="mt-1"
          rows={[
            { label: "Reviewed", value: toDayLabel(detail.createdAt) },
            { label: "Rating", value: detail.rating !== null ? `${detail.rating} / 10` : null },
            { label: "Likes", value: String(detail.engagement.likeCount) },
            { label: "Comments", value: String(detail.engagement.commentCount) },
          ]}
        />
      </section>
      <Link
        to={isTv ? "/serials/$tmdbId" : "/movies/$tmdbId"}
        params={{ tmdbId: String(detail.media.tmdbId) }}
        className="mono-meta inline-block uppercase text-muted-foreground hover:text-foreground"
        viewTransition
      >
        {isTv ? "Open the series →" : "Open the film →"}
      </Link>
    </aside>
  );
};
