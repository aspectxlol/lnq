import { Module } from "@nestjs/common";

import { AccountRepository, SessionRepository, UserRepository } from "./auth";

@Module({
  providers: [UserRepository, SessionRepository, AccountRepository],
  exports: [UserRepository, SessionRepository, AccountRepository],
})
export class RepositoryModule {}
