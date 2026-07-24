import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient as PrismaClientBase } from "@prisma/client";

const PrismaClientRuntime =
  process.env.NODE_ENV === "test" ? class {} : PrismaClientBase;

@Injectable()
export class PrismaService
  extends PrismaClientBase
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super(
      process.env.NODE_ENV === "test"
        ? undefined
        : {
            adapter: new PrismaPg({
              connectionString:
                process.env.DATABASE_URL ??
                "postgresql://postgres:postgres@localhost:5432/lnq",
            }),
          },
    );
  }

  async onModuleInit() {
    if (process.env.NODE_ENV === "test") {
      return;
    }

    await this.$connect();
  }

  async onModuleDestroy() {
    if (process.env.NODE_ENV === "test") {
      return;
    }

    await this.$disconnect();
  }
}
