import type { FastifyPluginAsync } from "fastify";

declare module "@fastify/cookie" {
  const fastifyCookie: FastifyPluginAsync<{ secret: string }>;
  export default fastifyCookie;
}
