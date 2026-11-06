import { reportStatusSchema, type ReportStatus } from "@/features/admin/api";

export const ADMIN_SECTIONS = [
  "reports",
  "users",
  "reviews",
  "diary",
  "posts",
  "movies",
  "serials",
  "lists",
  "activities",
] as const;

export type AdminSection = (typeof ADMIN_SECTIONS)[number];

export type AdminSearch = { section: AdminSection; status: ReportStatus };

const isAdminSection = (value: unknown): value is AdminSection =>
  typeof value === "string" && (ADMIN_SECTIONS as readonly string[]).includes(value);

// Keeps the admin section and report filter in the URL, so a refresh or a shared link lands in place.
export const parseAdminSearch = (search: Record<string, unknown>): AdminSearch => {
  const status = reportStatusSchema.safeParse(search.status);
  return {
    section: isAdminSection(search.section) ? search.section : "reports",
    status: status.success ? status.data : "pending",
  };
};
