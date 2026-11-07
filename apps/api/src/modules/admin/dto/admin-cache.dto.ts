import { z } from "zod";

export const AdminRefreshOldestSchema = z.object({
  kind: z.enum(["movie", "serial"]),
});
