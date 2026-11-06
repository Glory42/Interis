import { Film, Tv } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FavoritesPickerDialogs } from "./favorites/FavoritesPickerDialogs";
import { FavoritesSlotList } from "./favorites/FavoritesSlotList";
import { useSettingsFavoritesController } from "./favorites/useSettingsFavoritesController";
import { TickLoader } from "@/components/ui/tick-loader";

export const SettingsFavoritesSection = () => {
  const { user, isUserLoading } = useAuth();
  const controller = useSettingsFavoritesController(user?.username ?? "");

  if (isUserLoading || !user) {
    return (
      <div className="border px-4 py-3 text-sm shell-border shell-muted surface">
        <p className="flex items-center gap-2">
          <TickLoader /> Loading favorites settings...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border p-5 shell-border surface">
        <p className="mb-1 text-base font-bold text-foreground">Top Picks</p>
        <p className="mb-5 text-sm shell-muted">
          Set up to 4 favorites for Movie and Serial. These appear as a showcase on your public profile.
        </p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Film className="h-3.5 w-3.5" style={{ color: "var(--module-movie)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--module-movie)" }}>
                Movie
              </span>
              <span className="text-xs shell-muted">
                ({controller.selectedMovieCount}/4)
              </span>
            </div>

            <FavoritesSlotList
              category="movie"
              slots={controller.movieSlots}
              isBusy={controller.isBusy}
              onOpenSlotPicker={controller.openPickerForSlot}
              onClearSlot={controller.handleClearSlot}
            />
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <Tv className="h-3.5 w-3.5" style={{ color: "var(--module-serial)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--module-serial)" }}>
                Serial
              </span>
              <span className="text-xs shell-muted">
                ({controller.selectedSerialCount}/4)
              </span>
            </div>

            <FavoritesSlotList
              category="serial"
              slots={controller.serialSlots}
              isBusy={controller.isBusy}
              onOpenSlotPicker={controller.openPickerForSlot}
              onClearSlot={controller.handleClearSlot}
            />
          </div>
        </div>

        {controller.topPicksQuery.isPending ? (
          <p className="mt-4 flex items-center gap-2 text-sm shell-muted">
            <TickLoader /> Loading saved favorites...
          </p>
        ) : null}

        {controller.topPicksQuery.isError ? (
          <p className="mt-4 border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Could not load saved favorites.
          </p>
        ) : null}

        {controller.saveError ? (
          <p className="mt-4 border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {controller.saveError}
          </p>
        ) : null}

        {controller.saveSuccess ? (
          <p className="mt-4 border px-3 py-2 text-sm shell-border shell-accent shell-active-pill">
            {controller.saveSuccess}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => {
            void controller.handleSaveFavorites();
          }}
          disabled={controller.updateProfileMutation.isPending || !controller.isDirty}
          className="mt-5 px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: "var(--shell-accent)", color: "var(--primary-foreground)" }}
        >
          {controller.updateProfileMutation.isPending ? "Saving..." : "Save favorites"}
        </button>
      </div>

      <FavoritesPickerDialogs
        pickerTarget={controller.pickerTarget}
        searchQuery={controller.searchQuery}
        isSelectingMovie={controller.isSelectingMovie}
        isSelectingSeries={controller.isSelectingSeries}
        onClose={controller.closePicker}
        onQueryChange={controller.setSearchQuery}
        onSelectMovie={(movie) => {
          void controller.handleSelectMovie(movie);
        }}
        onSelectSeries={(series) => {
          void controller.handleSelectSeries(series);
        }}
      />
    </div>
  );
};
