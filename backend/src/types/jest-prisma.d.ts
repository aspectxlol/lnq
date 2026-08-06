import type { PrismaService } from "../src/prisma/prisma.service";

declare global {
  var jestPrisma: { client: PrismaService };
}

export {};
