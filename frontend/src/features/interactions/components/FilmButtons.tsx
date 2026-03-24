import { Heart, Eye, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const FilmButtons = () => (
  <div className="flex flex-wrap gap-2">
    <Button variant="outline" size="sm" disabled>
      <Eye className="h-4 w-4" /> Watched
    </Button>
    <Button variant="outline" size="sm" disabled>
      <Heart className="h-4 w-4" /> Liked
    </Button>
    <Button variant="outline" size="sm" disabled>
      <Clock3 className="h-4 w-4" /> Watchlist
    </Button>
  </div>
);
