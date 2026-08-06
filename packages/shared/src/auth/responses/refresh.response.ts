import { z } from "zod";

export const refreshResponseSchema = z.object({
  access_token: z.string(),
});

export type RefreshResponse = z.infer<typeof refreshResponseSchema>;
