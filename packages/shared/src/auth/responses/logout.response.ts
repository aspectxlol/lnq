import { z } from "zod";

export const logoutResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  timestamp: z.string(),
});

export type LogoutResponse = z.infer<typeof logoutResponseSchema>;
