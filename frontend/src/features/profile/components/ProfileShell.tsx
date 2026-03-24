import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useUserProfile } from "@/features/profile/hooks/useProfile";
import { ProfileHeader } from "@/features/profile/components/ProfileHeader";
import { cn } from "@/lib/utils";

type ProfileTab = "overview" | "diary" | "films" | "reviews" | "lists";

type ProfileShellProps = {
  username: string;
  activeTab: ProfileTab;
  children: ReactNode;
};

const tabClass =
  "inline-flex rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary/70 hover:text-foreground";

export const ProfileShell = ({
  username,
  activeTab,
  children,
}: ProfileShellProps) => {
  const profileQuery = useUserProfile(username);

  if (profileQuery.isPending) {
    return (
      <PageWrapper>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> Loading profile...
        </div>
      </PageWrapper>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <PageWrapper title="Profile not found">
        <Card className="p-4 text-sm text-muted-foreground">
          This user does not exist or cannot be loaded right now.
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-5">
        <ProfileHeader profile={profileQuery.data} />

        <nav className="flex flex-wrap gap-1 rounded-xl border border-border/70 bg-card/50 p-1">
          <Link
            to="/profile/$username"
            params={{ username }}
            className={cn(tabClass, activeTab === "overview" && "bg-secondary text-foreground")}
          >
            Overview
          </Link>
          <Link
            to="/profile/$username/diary"
            params={{ username }}
            className={cn(tabClass, activeTab === "diary" && "bg-secondary text-foreground")}
          >
            Diary
          </Link>
          <Link
            to="/profile/$username/films"
            params={{ username }}
            className={cn(tabClass, activeTab === "films" && "bg-secondary text-foreground")}
          >
            Films
          </Link>
          <Link
            to="/profile/$username/reviews"
            params={{ username }}
            className={cn(tabClass, activeTab === "reviews" && "bg-secondary text-foreground")}
          >
            Reviews
          </Link>
          <Link
            to="/profile/$username/lists"
            params={{ username }}
            className={cn(tabClass, activeTab === "lists" && "bg-secondary text-foreground")}
          >
            Lists
          </Link>
        </nav>

        {children}
      </div>
    </PageWrapper>
  );
};
