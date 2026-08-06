import { z } from "zod";

export const loginResponseSchema = z.object({
  success: z.boolean(),
  access_token: z.string(),
  userid: z.string(),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
