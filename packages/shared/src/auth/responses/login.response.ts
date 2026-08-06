import { z } from "zod";

export const loginResponseSchema = z.object({
  access_token: z.string(),
  userid: z.string(),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
