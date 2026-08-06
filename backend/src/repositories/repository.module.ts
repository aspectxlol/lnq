import { Module } from "@nestjs/common";
import { SessionRepository, UserRepository } from "./auth";

@Module({
  providers: [UserRepository, SessionRepository],
  exports: [UserRepository, SessionRepository],
})
export class RepositoryModule {}
