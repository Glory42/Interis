import { BookOpen, Film, Music, Tv, Users } from "lucide-react";
import type { QuickLink, ScopedTarget } from "./types";

export const MIN_QUERY_LENGTH = 2;
export const MAX_RESULTS_PER_SECTION = 6;

export const scopedPlaceholder: Record<ScopedTarget, string> = {
  users: "Search among users",
  cinema: "Search among cinema",
  serials: "Search among serials",
  music: "Search among music",
  books: "Search among books",
};

export const scopedEmptyPrompt: Record<ScopedTarget, string> = {
  users: "Search among users",
  cinema: "Search among cinema",
  serials: "Search among serials",
  music: "Search among music",
  books: "Search among books",
};

export const quickLinks: QuickLink[] = [
  {
    target: "users",
    title: "Discover Users",
    description: "Search among all members",
    icon: Users,
    color: "var(--destructive)",
    tint: "color-mix(in srgb, var(--destructive) 14%, transparent)",
  },
  {
    target: "cinema",
    title: "Discover Cinema",
    description: "Search among all films",
    icon: Film,
    color: "var(--module-cinema)",
    tint: "rgba(0, 255, 136, 0.1)",
  },
  {
    target: "serials",
    title: "Discover Serials",
    description: "Search among all series",
    icon: Tv,
    color: "var(--module-serial)",
    tint: "rgba(0, 207, 255, 0.1)",
  },
  {
    target: "music",
    title: "Discover Music",
    description: "Search among all albums",
    icon: Music,
    color: "var(--module-music)",
    tint: "color-mix(in srgb, var(--module-music) 12%, transparent)",
  },
  {
    target: "books",
    title: "Discover Books",
    description: "Search among all books",
    icon: BookOpen,
    color: "var(--module-book)",
    tint: "color-mix(in srgb, var(--module-book) 12%, transparent)",
  },
];
