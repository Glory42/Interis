import type { PersonRouteRole } from "../types/people.types";

const KNOWN_FOR_ACTING = new Set(["acting"]);
const KNOWN_FOR_DIRECTING = new Set([
  "directing",
  "production",
  "writing",
  "creator",
  "crew",
]);

const trimToNull = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const slugifyPersonName = (name: string): string => {
  const normalized = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized : "person";
};

export const normalizePersonRouteSlug = (rawSlug: string): string | null => {
  const trimmed = rawSlug.trim().toLowerCase();
  if (trimmed.length === 0) {
    return null;
  }

  if (!/^[a-z0-9-]+$/.test(trimmed)) {
    return null;
  }

  const normalized = trimmed
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized : null;
};

export const normalizeKnownForDepartment = (
  knownForDepartment: string | null | undefined,
): string | null => {
  return trimToNull(knownForDepartment);
};

export const inferRoleHintsFromKnownForDepartment = (
  knownForDepartment: string | null | undefined,
): PersonRouteRole[] => {
  const normalized = normalizeKnownForDepartment(knownForDepartment)?.toLowerCase();
  if (!normalized) {
    return [];
  }

  const hints: PersonRouteRole[] = [];

  if (KNOWN_FOR_ACTING.has(normalized)) {
    hints.push("actor");
  }

  if (KNOWN_FOR_DIRECTING.has(normalized)) {
    hints.push("director");
  }

  return hints;
};

export const mergeRoleHints = (
  ...roleHintLists: PersonRouteRole[][]
): PersonRouteRole[] => {
  const deduped = new Set<PersonRouteRole>();

  for (const roleHintList of roleHintLists) {
    for (const roleHint of roleHintList) {
      deduped.add(roleHint);
    }
  }

  return [...deduped];
};
