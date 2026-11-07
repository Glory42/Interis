import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

// Announces the load once to screen readers; the shapes inside are aria-hidden.
export const LoadingRegion = ({ label, className, children }: { label: string; className?: string; children: ReactNode }) => (
  <div role="status" aria-label={label} aria-busy="true" className={className}>
    {children}
  </div>
);

// A black slate strip with two short label bars, like the real slate headers.
export const SlateSkeleton = ({ className }: { className?: string }) => (
  <div aria-hidden className={cn("slate rounded-t-[3px]", className)}>
    <span className="h-2 w-32 animate-pulse rounded-sm bg-white/10" />
    <span className="h-2 w-20 animate-pulse rounded-sm bg-white/10" />
  </div>
);

// Poster, kicker, title and a quote line: feed cards, review rows, activity rows.
export const TitleRowSkeleton = ({ posterWidth = "w-14", bordered = false }: { posterWidth?: string; bordered?: boolean }) => (
  <div
    className={cn(
      "flex items-start gap-3.5 py-3.5",
      bordered ? "rounded-[3px] border border-[color:var(--line)] px-3" : "border-b border-[color:var(--line)] last:border-b-0",
    )}
  >
    <Skeleton shape="poster" className={cn("shrink-0 rounded-[2px]", posterWidth)} />
    <div className="min-w-0 flex-1 space-y-2 pt-0.5">
      <Skeleton className="h-2.5 w-28 rounded-sm" />
      <Skeleton className="h-4 w-1/2 rounded-sm" />
      <Skeleton className="h-3 w-4/5 rounded-sm" />
    </div>
  </div>
);

export const TitleRowsSkeleton = ({ count = 4, posterWidth, bordered }: { count?: number; posterWidth?: string; bordered?: boolean }) => (
  <div className={bordered ? "space-y-3" : undefined}>
    {Array.from({ length: count }, (_, index) => (
      <TitleRowSkeleton key={index} posterWidth={posterWidth} bordered={bordered} />
    ))}
  </div>
);

// Avatar or icon, a name and a meta line: comments, follow lists, admin rows, episodes.
export const LineRowsSkeleton = ({ count = 5, withAvatar = true }: { count?: number; withAvatar?: boolean }) => (
  <div>
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="flex items-center gap-3 border-b border-[color:var(--line)] py-3 last:border-b-0">
        {withAvatar ? <Skeleton shape="avatar" className="size-8 shrink-0" /> : null}
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-3 rounded-sm" style={{ width: `${40 + ((index * 17) % 35)}%` }} />
          <Skeleton className="h-2.5 w-1/4 rounded-sm" />
        </div>
      </div>
    ))}
  </div>
);

export const PosterGridSkeleton = ({ count = 12, className }: { count?: number; className?: string }) => (
  <div className={cn("grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6", className)}>
    {Array.from({ length: count }, (_, index) => (
      <Skeleton key={index} shape="poster" className="rounded-[3px]" />
    ))}
  </div>
);

// Film/TV detail: backdrop band, poster + action card aside, opening-credit header and synopsis.
export const MediaDetailSkeleton = ({ label }: { label: string }) => (
  <LoadingRegion label={label} className="min-h-screen">
    <Skeleton className="h-56 w-full rounded-none sm:h-72" />
    <div className="relative mx-auto -mt-20 w-full max-w-5xl px-4 pb-10 sm:-mt-28">
      <Skeleton className="mb-4 h-3 w-12 rounded-sm" />
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[220px_1fr]">
        <div className="hidden space-y-3 md:block">
          <Skeleton shape="poster" className="rounded-xl" />
          <Skeleton className="h-12 w-full rounded-full" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
        <div className="space-y-3 md:pt-28">
          <div className="flex items-end gap-3">
            <Skeleton shape="poster" className="w-[84px] shrink-0 rounded-sm md:hidden" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-40 rounded-sm" />
              <Skeleton className="h-9 w-3/4 rounded-sm md:h-12" />
              <Skeleton className="h-4 w-1/2 rounded-sm" />
            </div>
          </div>
          <div className="flex gap-6 border-b border-[color:var(--line)] pt-2 pb-5">
            <Skeleton className="h-6 w-24 rounded-sm" />
            <Skeleton className="h-6 w-20 rounded-sm" />
            <Skeleton className="h-6 w-24 rounded-sm" />
          </div>
          <Skeleton className="h-12 w-full rounded-full md:hidden" />
          <div className="space-y-2 pt-3">
            <Skeleton shape="line" />
            <Skeleton shape="line" />
            <Skeleton shape="line" className="w-2/3" />
          </div>
        </div>
      </div>
    </div>
  </LoadingRegion>
);

// Profile header card (slate, avatar, name, counts) over the tab row.
export const ProfileHeaderSkeleton = () => (
  <LoadingRegion label="Loading profile" className="mx-auto w-full max-w-5xl px-4 py-10">
    <div className="mb-5 rounded-[3px] border border-[color:var(--line)]">
      <SlateSkeleton />
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
        <Skeleton shape="avatar" className="size-16 shrink-0 sm:size-[76px]" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-8 w-48 rounded-sm" />
          <Skeleton className="h-3 w-72 max-w-full rounded-sm" />
          <Skeleton className="h-3 w-56 max-w-full rounded-sm" />
        </div>
      </div>
    </div>
    <div className="flex gap-6 border-b border-[color:var(--line)] px-4 py-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-3 w-14 rounded-sm" />
      ))}
    </div>
    <div className="mt-8">
      <TitleRowsSkeleton count={3} />
    </div>
  </LoadingRegion>
);

// A slate-headed card with a title block and body lines: review, list and person pages.
export const DocumentSkeleton = ({
  label,
  withPoster = true,
  className,
  children,
}: {
  label: string;
  withPoster?: boolean;
  className?: string;
  children?: ReactNode;
}) => (
  <LoadingRegion label={label} className={cn("mx-auto w-full max-w-5xl px-4 py-10", className)}>
    <div className="rounded-[3px] border border-[color:var(--line)]">
      <SlateSkeleton />
      <div className="flex gap-4 p-4 sm:p-5">
        {withPoster ? <Skeleton shape="poster" className="w-20 shrink-0 rounded-[3px] sm:w-28" /> : null}
        <div className="min-w-0 flex-1 space-y-2.5">
          <Skeleton className="h-3 w-32 rounded-sm" />
          <Skeleton className="h-8 w-2/3 rounded-sm" />
          <Skeleton className="h-3 w-1/3 rounded-sm" />
          <div className="space-y-2 pt-3">
            <Skeleton shape="line" />
            <Skeleton shape="line" />
            <Skeleton shape="line" className="w-3/4" />
          </div>
        </div>
      </div>
    </div>
    {children ? <div className="mt-8">{children}</div> : null}
  </LoadingRegion>
);

// Stats tab: headline numbers, then two chart blocks.
export const StatsSkeleton = () => (
  <LoadingRegion label="Loading stats" className="space-y-8">
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-9 w-20 rounded-sm" />
          <Skeleton className="h-2.5 w-16 rounded-sm" />
        </div>
      ))}
    </div>
    <div className="grid gap-8 md:grid-cols-2">
      <Skeleton className="h-40 rounded-[3px]" />
      <Skeleton className="h-40 rounded-[3px]" />
    </div>
  </LoadingRegion>
);

// Settings section: a heading, then labelled fields.
export const SettingsSectionSkeleton = ({ label = "Loading settings" }: { label?: string }) => (
  <LoadingRegion label={label} className="space-y-5">
    <Skeleton className="h-5 w-40 rounded-sm" />
    {Array.from({ length: 3 }, (_, index) => (
      <div key={index} className="space-y-2">
        <Skeleton className="h-2.5 w-24 rounded-sm" />
        <Skeleton className="h-10 w-full max-w-md rounded-[3px]" />
      </div>
    ))}
  </LoadingRegion>
);
