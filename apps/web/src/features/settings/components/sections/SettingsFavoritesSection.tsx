import { Skeleton } from "@/components/ui/Skeleton";
import { LoadingRegion, SettingsSectionSkeleton } from "@/components/ui/PageSkeletons";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FavoritesPickerDialogs } from "./favorites/FavoritesPickerDialogs";
import { TopPickSlots } from "./favorites/TopPickSlots";
import { Button } from "@/components/ui/button";
import { useSettingsFavoritesController } from "./favorites/useSettingsFavoritesController";

export const SettingsFavoritesSection = () => {
  const { user, isUserLoading } = useAuth();
  const controller = useSettingsFavoritesController(user?.username ?? "");

  if (isUserLoading || !user) {
    return <SettingsSectionSkeleton label="Loading favorites settings" />;
  }

  const groups = [
    { category: "movie" as const, label: "Films", slots: controller.movieSlots, count: controller.selectedMovieCount },
    { category: "serial" as const, label: "Series", slots: controller.serialSlots, count: controller.selectedSerialCount },
  ];

  return (
    <section>
      <h2 className="display-4 text-foreground">Top 4</h2>
      <p className="body-s mt-1 text-muted-foreground">Shown at the top of your profile, in this order.</p>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        {groups.map((group) => (
          <div key={group.category}>
            <h3 className="kicker mb-2 text-muted-foreground">{`${group.label} · ${group.count}/4`}</h3>
            <TopPickSlots
              category={group.category}
              slots={group.slots}
              isBusy={controller.isBusy}
              onPick={controller.openPickerForSlot}
              onMove={controller.moveSlot}
              onRemove={controller.handleClearSlot}
            />
          </div>
        ))}
      </div>

      {controller.topPicksQuery.isPending ? (
        <LoadingRegion label="Loading your Top 4" className="mt-4 grid max-w-md grid-cols-4 gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} shape="poster" className="rounded-[3px]" />
          ))}
        </LoadingRegion>
      ) : null}
      {controller.topPicksQuery.isError ? (
        <p className="body-s mt-4 text-[color:var(--danger)]">Could not load your Top 4.</p>
      ) : null}
      {controller.saveError ? (
        <p role="alert" className="body-s mt-4 text-[color:var(--danger)]">
          {controller.saveError}
        </p>
      ) : null}
      {controller.saveSuccess ? <p className="body-s mt-4 text-primary">{controller.saveSuccess}</p> : null}

      <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-[color:var(--line)] pt-4">
        {controller.changeSummary ? (
          <span className="body-s mr-auto text-muted-foreground">{controller.changeSummary}</span>
        ) : null}
        <Button variant="outline" size="md" disabled={!controller.isDirty || controller.isBusy} onClick={controller.discardChanges}>
          Discard
        </Button>
        <Button size="md" disabled={controller.updateProfileMutation.isPending || !controller.isDirty} onClick={() => void controller.handleSaveFavorites()}>
          {controller.updateProfileMutation.isPending ? "Saving…" : "Save top 4"}
        </Button>
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
    </section>
  );
};
