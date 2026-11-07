import type { ComponentType } from "react";
import { SentenceSelect } from "@/components/ui/SentenceSelect";
import { AdminActivitiesPanel } from "@/features/admin/components/AdminActivitiesPanel";
import { AdminCommentsPanel } from "@/features/admin/components/AdminCommentsPanel";
import { AdminDiaryPanel } from "@/features/admin/components/AdminDiaryPanel";
import { AdminListsPanel } from "@/features/admin/components/AdminListsPanel";
import { AdminFilmsPanel } from "@/features/admin/components/AdminFilmsPanel";
import { AdminPostsPanel } from "@/features/admin/components/AdminPostsPanel";
import { AdminReviewsPanel } from "@/features/admin/components/AdminReviewsPanel";
import { AdminTvPanel } from "@/features/admin/components/AdminTvPanel";
import { CONTENT_TYPES, type ContentType } from "@/features/admin/content-types";

const PANELS: Record<ContentType, ComponentType> = {
  reviews: AdminReviewsPanel,
  diary: AdminDiaryPanel,
  posts: AdminPostsPanel,
  comments: AdminCommentsPanel,
  lists: AdminListsPanel,
  activities: AdminActivitiesPanel,
  movies: AdminFilmsPanel,
  serials: AdminTvPanel,
};

export const AdminContentPage = ({ type, onTypeChange }: { type: ContentType; onTypeChange: (type: ContentType) => void }) => {
  const Panel = PANELS[type];
  return (
    <div>
      <p className="body-s mb-4 text-muted-foreground">
        {"Showing "}
        <SentenceSelect value={type} options={CONTENT_TYPES} onChange={onTypeChange} />
        {", newest first."}
      </p>
      <Panel />
    </div>
  );
};
