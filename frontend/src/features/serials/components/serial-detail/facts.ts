import {
  BookText,
  CalendarDays,
  Clock3,
  Languages,
  RadioTower,
  Rows3,
  Star,
  type LucideIcon,
} from "lucide-react";
import type { SerialDetailResponse } from "@/features/serials/api";

export type SerialFactRow = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export const buildSerialFactRows = (
  detail: SerialDetailResponse,
  runtimeLabel: string | null,
  languageLabel: string | null,
  firstAirDateLabel: string | null,
  lastAirDateLabel: string | null,
): SerialFactRow[] => {
  const series = detail.series;

  return [
    {
      label: "Creator",
      value: series.creator ?? "Unknown",
      icon: BookText,
    },
    {
      label: "Runtime",
      value: runtimeLabel ?? "Unknown",
      icon: Clock3,
    },
    {
      label: "Language",
      value: languageLabel ?? "Unknown",
      icon: Languages,
    },
    {
      label: "Network",
      value: series.network ?? "Unknown",
      icon: RadioTower,
    },
    {
      label: "First Air",
      value: firstAirDateLabel ?? "Unknown",
      icon: CalendarDays,
    },
    {
      label: "Last Air",
      value: lastAirDateLabel ?? "Unknown",
      icon: CalendarDays,
    },
    {
      label: "Seasons",
      value: series.numberOfSeasons ? String(series.numberOfSeasons) : "Unknown",
      icon: Rows3,
    },
    {
      label: "Episodes",
      value: series.numberOfEpisodes ? String(series.numberOfEpisodes) : "Unknown",
      icon: Rows3,
    },
    {
      label: "Status",
      value: series.status ?? "Unknown",
      icon: Star,
    },
    {
      label: "In Production",
      value:
        series.inProduction === null
          ? "Unknown"
          : series.inProduction
            ? "Yes"
            : "No",
      icon: RadioTower,
    },
  ];
};
