import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHealthCheck() {
    return {
      status: 200,
      message: "ok",
    };
  }
}
