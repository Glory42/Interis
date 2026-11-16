import { z } from "zod";
import { tmdbIdSchema } from "../../../commons/validation/common.schemas";
import { YearReviewParamsSchema } from "../../year-review/dto/year-review.dto";

export type ShareMeta = {
  kind: "review" | "profile" | "list" | "film" | "series" | "season" | "person" | "recap";
  ogType: string;
  title: string;
  description: string;
  // A path on the API's origin for generated cards, an absolute URL otherwise, or null.
  image: string | null;
  // The page's canonical path on the web app's origin.
  path: string;
};

export const shareTmdbIdSchema = tmdbIdSchema.max(2_147_483_647);
export const shareSeasonNumberSchema = z.coerce.number().int().min(0).max(500);
export const sharePersonRoleSchema = z.enum(["actor", "director"]);
export const shareRecapParamsSchema = YearReviewParamsSchema;
