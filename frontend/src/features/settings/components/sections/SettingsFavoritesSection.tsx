import { Film, Tv } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FavoritesPickerDialogs } from "./favorites/FavoritesPickerDialogs";
import { FavoritesSlotList } from "./favorites/FavoritesSlotList";
import { useSettingsFavoritesController } from "./favorites/useSettingsFavoritesController";

export const SettingsFavoritesSection = () => {
  const { user, isUserLoading } = useAuth();
  const controller = useSettingsFavoritesController(user?.username ?? "");

  if (isUserLoading || !user) {
    return (
      <div className="border px-4 py-3 text-sm settings-shell-border settings-shell-muted settings-shell-panel">
        <p className="flex items-center gap-2">
          <Spinner /> Loading favorites settings...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border p-5 settings-shell-border settings-shell-panel">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] settings-shell-accent">
          Top Picks
        </p>
        <p className="mb-5 font-mono text-[10px] settings-shell-muted">
          Set up to 4 favorites for Cinema and Serial. These appear as a showcase on your public profile.
        </p>

        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Film className="h-3.5 w-3.5" style={{ color: "var(--module-cinema)" }} />
              <span
                className="font-mono text-[9px] uppercase tracking-[0.16em]"
                style={{ color: "var(--module-cinema)" }}
              >
                Cinema
              </span>
              <span className="font-mono text-[9px] settings-shell-muted">
                ({controller.selectedCinemaCount}/4)
              </span>
            </div>

            <FavoritesSlotList
              category="cinema"
              slots={controller.cinemaSlots}
              isBusy={controller.isBusy}
              onOpenSlotPicker={controller.openPickerForSlot}
              onClearSlot={controller.handleClearSlot}
            />
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <Tv className="h-3.5 w-3.5" style={{ color: "var(--module-serial)" }} />
              <span
                className="font-mono text-[9px] uppercase tracking-[0.16em]"
                style={{ color: "var(--module-serial)" }}
              >
                Serial
              </span>
              <span className="font-mono text-[9px] settings-shell-muted">
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
          <p className="mt-4 flex items-center gap-2 font-mono text-xs settings-shell-muted">
            <Spinner className="h-3.5 w-3.5" /> Loading saved favorites...
          </p>
        ) : null}

        {controller.topPicksQuery.isError ? (
          <p className="mt-4 border border-destructive/40 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
            Could not load saved favorites.
          </p>
        ) : null}

        {controller.saveError ? (
          <p className="mt-4 border border-destructive/40 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
            {controller.saveError}
          </p>
        ) : null}

        {controller.saveSuccess ? (
          <p className="mt-4 border px-3 py-2 font-mono text-xs settings-shell-border settings-shell-accent settings-shell-active-pill">
            {controller.saveSuccess}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => {
            void controller.handleSaveFavorites();
          }}
          disabled={controller.updateProfileMutation.isPending || !controller.isDirty}
          className="mt-6 border px-5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors settings-shell-border settings-shell-accent settings-shell-active-pill disabled:cursor-not-allowed disabled:opacity-60"
        >
          {controller.updateProfileMutation.isPending ? "Saving..." : "Save Favorites"}
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
