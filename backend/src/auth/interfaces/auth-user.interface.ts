import { roles } from "../../db/schema";

export interface AuthUser {
  id: string;
  email: string;
  role: (typeof roles.enumValues)[number];
}
