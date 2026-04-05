import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { getRelativeTime } from "@/features/profile/utils/profile.utils";
import type { ProfileRecentActivityItem } from "./profileOverview.utils";

type ProfileRecentActivitySectionProps = {
  activities: ProfileRecentActivityItem[];
};

export const ProfileRecentActivitySection = ({
  activities,
}: ProfileRecentActivitySectionProps) => {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        Recent Activity
      </h3>

      <div className="space-y-2">
        {activities.length === 0 ? (
          <div className=" border border-dashed border-border/70 bg-card/25 p-3 text-sm text-muted-foreground">
            No recent activity yet.
          </div>
        ) : (
          activities.map((item) => (
            <Link
              key={item.id}
              to="/cinema/$tmdbId"
              params={{ tmdbId: String(item.tmdbId) }}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-2  border border-border/50 bg-card/20 px-3 py-2.5 transition-colors hover:border-border/70 hover:bg-card/35"
              viewTransition
            >
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center  border border-primary/25 bg-primary/10">
                <Zap className="h-3 w-3 text-primary" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-tight text-foreground/85">
                  <span className="font-semibold text-foreground">{item.actionLabel}</span>{" "}
                  <span className="font-semibold text-primary">{item.movieTitle}</span>
                  {item.ratingLabel ? (
                    <span className="text-muted-foreground"> · {item.ratingLabel}</span>
                  ) : null}
                </p>
              </div>

              <span className="flex-shrink-0 text-[11px] text-muted-foreground/80">
                {getRelativeTime(item.createdAt)}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};
