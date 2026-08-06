import { z } from "zod";

export const roleSchema = z.enum(["CUSTOMER", "ADMIN", "STAFF", "OWNER"]);
export type Role = z.infer<typeof roleSchema>;
