import { z } from "zod";

export const oauthProviderSchema = z.enum(["google", "facebook", "github"]);
export type OAuthProvider = z.infer<typeof oauthProviderSchema>;
