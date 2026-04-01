import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

const updateThemeResponseSchema = z.object({
  themeId: z.string(),
});

export const updateMyTheme = async (themeId: string): Promise<string> => {
  const response = await apiRequest<unknown, { themeId: string }>(
    "/api/users/me/theme",
    {
      method: "PUT",
      body: { themeId },
    },
  );

  return updateThemeResponseSchema.parse(response).themeId;
};
