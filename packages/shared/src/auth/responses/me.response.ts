import { z } from "zod";
import { roleSchema } from "../types/role.js";

export const meResponseSchema = z.object({
  success: z.boolean(),
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  name: z.string(),
  phone: z.string().nullable(),
  role: roleSchema,
  phoneVerifiedAt: z.date().nullable(),
  emailVerifiedAt: z.date().nullable(),
  isActive: z.boolean(),
});

export type MeResponse = z.infer<typeof meResponseSchema>;
