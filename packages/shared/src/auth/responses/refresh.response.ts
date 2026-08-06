import { z } from "zod";

export const refreshResponseSchema = z.object({
  success: z.boolean(),
  access_token: z.string(),
});

export type RefreshResponse = z.infer<typeof refreshResponseSchema>;
