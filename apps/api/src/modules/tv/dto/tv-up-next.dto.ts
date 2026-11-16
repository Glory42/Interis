import { z } from "zod";

// GET /api/serials/up-next?tz=Europe/Istanbul. The zone decides "today"; invalid means UTC.
export const UpNextQuerySchema = z.object({
  tz: z.string().max(64).optional(),
});
