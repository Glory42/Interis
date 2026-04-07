import { z } from "zod";
import { personRouteRoleValues } from "../types/people.types";

export type PersonRouteParams = {
  role: string;
  slug: string;
};

export const personRouteRoleSchema = z.enum(personRouteRoleValues);
