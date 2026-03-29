import { Check, Clock3, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  useMovieInteraction,
  useUpdateMovieInteraction,
} from "@/features/interactions/hooks/useInteractions";

type FilmButtonsProps = {
  tmdbId: number;
};

export const FilmButtons = ({ tmdbId }: FilmButtonsProps) => {
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);
  const interactionQuery = useMovieInteraction(
    tmdbId,
    isAuthenticated && tmdbId > 0,
  );
  const updateInteractionMutation = useUpdateMovieInteraction(tmdbId);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled>
          <Heart className="h-4 w-4" /> Like
        </Button>
        <Button variant="outline" size="sm" disabled>
          <Clock3 className="h-4 w-4" /> Watchlist
        </Button>
      </div>
    );
  }

  const liked = interactionQuery.data?.liked ?? false;
  const watchlisted = interactionQuery.data?.watchlisted ?? false;
  const isLoading = interactionQuery.isPending || updateInteractionMutation.isPending;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={liked ? "primary" : "outline"}
        size="sm"
        disabled={isLoading}
        onClick={() => {
          void updateInteractionMutation.mutateAsync({ liked: !liked });
        }}
      >
        {isLoading ? <Spinner className="h-3.5 w-3.5" /> : <Heart className="h-4 w-4" />}
        {liked ? "Liked" : "Like"}
      </Button>

      <Button
        variant={watchlisted ? "secondary" : "outline"}
        size="sm"
        disabled={isLoading}
        onClick={() => {
          void updateInteractionMutation.mutateAsync({ watchlisted: !watchlisted });
        }}
      >
        {isLoading ? (
          <Spinner className="h-3.5 w-3.5" />
        ) : (
          <Clock3 className="h-4 w-4" />
        )}
        {watchlisted ? "Watchlisted" : "Watchlist"}
      </Button>

      <Button variant="ghost" size="sm" disabled>
        <Check className="h-4 w-4" /> Watched via diary log
      </Button>
    </div>
  );
};
