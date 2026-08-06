import { z } from "zod";

import { roleSchema } from "../types/role";

export const userModel = z.object({
  id: z.string(),

  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  role: roleSchema,

  isActive: z.boolean(),

  phoneVerifiedAt: z.date().nullable(),
  emailVerifiedAt: z.date().nullable(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserModel = z.infer<typeof userModel>;
