import { z } from "zod";

export const authTokenTypeSchema = z.enum([
  "refresh",
  "reset-password",
  "verify-email",
  "magic-link",
]);
export type AuthTokenType = z.infer<typeof authTokenTypeSchema>;
