import { z } from "zod";

export const personRouteRoleSchema = z.enum(["actor", "director"]);

export const personLinkSchema = z.object({
  tmdbPersonId: z.number().int().positive(),
  slug: z.string(),
  name: z.string(),
  profilePath: z.string().nullable(),
  knownForDepartment: z.string().nullable(),
  routeRole: personRouteRoleSchema,
  character: z.string().nullable(),
  job: z.string().nullable(),
  department: z.string().nullable(),
});

export type PersonRouteRole = z.infer<typeof personRouteRoleSchema>;
export type PersonLink = z.infer<typeof personLinkSchema>;
