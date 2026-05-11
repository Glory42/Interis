import { Award, Funnel, Tag } from "lucide-react";
import type { FocusEventHandler, RefObject } from "react";
import type { MusicArchiveResponse, MusicArchiveSort } from "@/features/music/api";
import { ArchiveMenuRadioOption } from "@/features/music/components/music-archive/ArchiveMenuRadioOption";
import { ArchiveMenuTrigger } from "@/features/music/components/music-archive/ArchiveMenuTrigger";
import {
  MUSIC_MODULE_STYLES,
  sortOptions,
  typeOptions,
} from "@/features/music/components/music-archive/constants";
import type { OpenMenu } from "@/features/music/components/music-archive/types";

type MusicArchiveControlsProps = {
  controlsRef: RefObject<HTMLDivElement | null>;
  openMenu: OpenMenu;
  onBlurCapture: FocusEventHandler<HTMLDivElement>;
  onToggleMenu: (menu: Exclude<OpenMenu, null>) => void;
  onCloseMenu: () => void;
  selectedGenre: string;
  selectedType: string;
  selectedSort: MusicArchiveSort;
  selectedSortLabel: string;
  selectedTypeLabel: string;
  availableGenres?: MusicArchiveResponse["availableGenres"];
  archiveCountLabel: string;
  onSelectGenre: (genre: string) => void;
  onSelectSort: (sort: MusicArchiveSort) => void;
  onSelectType: (type: string) => void;
};

export const MusicArchiveControls = ({
  controlsRef,
  openMenu,
  onBlurCapture,
  onToggleMenu,
  onCloseMenu,
  selectedGenre,
  selectedType,
  selectedSort,
  selectedSortLabel,
  selectedTypeLabel,
  availableGenres,
  archiveCountLabel,
  onSelectGenre,
  onSelectSort,
  onSelectType,
}: MusicArchiveControlsProps) => {
  return (
    <div
      ref={controlsRef}
      onBlurCapture={onBlurCapture}
      className="mb-8 border-b pb-4"
      style={{ borderColor: MUSIC_MODULE_STYLES.border }}
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.22em]"
          style={{ color: MUSIC_MODULE_STYLES.faint }}
        >
          Filter:
        </span>

        <ArchiveMenuTrigger
          menu="genre"
          openMenu={openMenu}
          onToggleMenu={onToggleMenu}
          icon={<Funnel className="h-3 w-3" />}
          label={selectedGenre === "all" ? "All Genres" : selectedGenre}
          menuClassName="min-w-42.5"
        >
          <div className="max-h-36 overflow-y-auto sm:max-h-48">
            <ArchiveMenuRadioOption
              isSelected={selectedGenre === "all"}
              onSelect={() => { onSelectGenre("all"); onCloseMenu(); }}
            >
              All Genres
            </ArchiveMenuRadioOption>
            {(availableGenres ?? []).map((genre) => (
              <ArchiveMenuRadioOption
                key={`music-genre-option-${genre.name}`}
                isSelected={selectedGenre === genre.name}
                onSelect={() => { onSelectGenre(genre.name); onCloseMenu(); }}
              >
                {typeof genre.count === "number" ? `${genre.name} (${genre.count})` : genre.name}
              </ArchiveMenuRadioOption>
            ))}
          </div>
        </ArchiveMenuTrigger>

        <ArchiveMenuTrigger
          menu="type"
          openMenu={openMenu}
          onToggleMenu={onToggleMenu}
          icon={<Tag className="h-3 w-3" />}
          label={`Type: ${selectedTypeLabel}`}
          menuClassName="min-w-38"
        >
          {typeOptions.map((option) => (
            <ArchiveMenuRadioOption
              key={`music-type-option-${option.value}`}
              isSelected={selectedType === option.value}
              onSelect={() => { onSelectType(option.value); onCloseMenu(); }}
            >
              {option.label}
            </ArchiveMenuRadioOption>
          ))}
        </ArchiveMenuTrigger>

        <ArchiveMenuTrigger
          menu="sort"
          openMenu={openMenu}
          onToggleMenu={onToggleMenu}
          icon={<Award className="h-3 w-3" />}
          label={`Sort: ${selectedSortLabel}`}
          menuClassName="min-w-45"
        >
          {sortOptions.map((option) => (
            <ArchiveMenuRadioOption
              key={`music-sort-option-${option.value}`}
              isSelected={selectedSort === option.value}
              onSelect={() => { onSelectSort(option.value); onCloseMenu(); }}
            >
              {option.label}
            </ArchiveMenuRadioOption>
          ))}
        </ArchiveMenuTrigger>

        <p
          className="ml-auto shrink-0 font-mono text-[10px]"
          style={{ color: MUSIC_MODULE_STYLES.faint }}
        >
          {archiveCountLabel}
        </p>
      </div>
    </div>
  );
};
