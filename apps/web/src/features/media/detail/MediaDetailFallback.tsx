import { MediaDetailSkeleton } from "@/components/ui/PageSkeletons";
import { MediaDetailStatusPanel } from "@/features/media/detail/MediaDetailStatusPanel";
import type { MediaKind } from "@/features/media/media-cache";
import { FILM_MODULE_STYLES, SERIES_MODULE_STYLES } from "@/features/media/styles";

type MediaDetailFallbackProps = {
  kind: MediaKind;
  isValidId: boolean;
  isPending: boolean;
};

// What a detail page shows instead of the title: a bad id, the load, or a failed load.
export const MediaDetailFallback = ({ kind, isValidId, isPending }: MediaDetailFallbackProps) => {
  const noun = kind === "film" ? "movie" : "series";
  const moduleStyles = kind === "film" ? FILM_MODULE_STYLES : SERIES_MODULE_STYLES;

  if (!isValidId) return <MediaDetailStatusPanel message={`Invalid ${noun} id.`} moduleStyles={moduleStyles} />;
  if (isPending) return <MediaDetailSkeleton label={kind === "film" ? "Loading film" : "Loading show"} />;
  return <MediaDetailStatusPanel message={`Could not load this ${noun} right now.`} moduleStyles={moduleStyles} />;
};
