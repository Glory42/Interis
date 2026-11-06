import type { ComponentType } from "react";
import type { AdminSearch } from "@/features/admin/admin-search";
import { AdminActivitiesPanel } from "@/features/admin/components/AdminActivitiesPanel";
import { AdminDiaryPanel } from "@/features/admin/components/AdminDiaryPanel";
import { AdminListsPanel } from "@/features/admin/components/AdminListsPanel";
import { AdminMoviesPanel } from "@/features/admin/components/AdminMoviesPanel";
import { AdminPostsPanel } from "@/features/admin/components/AdminPostsPanel";
import { AdminReportsPanel } from "@/features/admin/components/AdminReportsPanel";
import { AdminReviewsPanel } from "@/features/admin/components/AdminReviewsPanel";
import { AdminSerialsPanel } from "@/features/admin/components/AdminSerialsPanel";
import { AdminSidebarNav, type AdminSection } from "@/features/admin/components/AdminSidebarNav";
import { AdminUsersPanel } from "@/features/admin/components/AdminUsersPanel";

const SECTION_PANELS: Record<Exclude<AdminSection, "reports">, ComponentType> = {
  users: AdminUsersPanel,
  reviews: AdminReviewsPanel,
  diary: AdminDiaryPanel,
  posts: AdminPostsPanel,
  movies: AdminMoviesPanel,
  serials: AdminSerialsPanel,
  lists: AdminListsPanel,
  activities: AdminActivitiesPanel,
};

export const AdminDashboardPage = ({
  search,
  onSearchChange,
}: {
  search: AdminSearch;
  onSearchChange: (search: AdminSearch) => void;
}) => {
  const { section } = search;
  const ActivePanel = section === "reports" ? null : SECTION_PANELS[section];

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      <AdminSidebarNav
        active={section}
        onChange={(next) => onSearchChange({ ...search, section: next })}
      />
      <div className="min-w-0 flex-1 overflow-y-auto max-h-[calc(100vh-11rem)]">
        {ActivePanel ? (
          <ActivePanel />
        ) : (
          <AdminReportsPanel
            status={search.status}
            onStatusChange={(status) => onSearchChange({ ...search, status })}
          />
        )}
      </div>
    </div>
  );
};
