import { z } from "zod";
import {
  personCreditMediaValues,
  personCreditOrderValues,
  personCreditTypeValues,
  personRouteRoleValues,
} from "../types/people.types";

export type PersonRouteParams = {
  role: string;
  slug: string;
};

export const personRouteRoleSchema = z.enum(personRouteRoleValues);

export const PERSON_CREDITS_DEFAULT_LIMIT = 40;

export const PersonCreditsQuerySchema = z.object({
  media: z.enum(personCreditMediaValues).default("combined"),
  type: z.enum(personCreditTypeValues).default("cast"),
  job: z.string().trim().min(1).max(80).optional(),
  order: z.enum(personCreditOrderValues).default("recent"),
  limit: z.coerce.number().int().positive().max(100).default(PERSON_CREDITS_DEFAULT_LIMIT),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export type PersonCreditsQuery = z.infer<typeof PersonCreditsQuerySchema>;
