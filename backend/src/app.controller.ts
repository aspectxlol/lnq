import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { ApiTags, ApiOperation, ApiOkResponse } from "@nestjs/swagger";

@ApiTags("Root")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/health")
  @ApiOperation({ summary: "Health check endpoint" })
  @ApiOkResponse({ description: "Service health status" })
  healthcheck() {
    return this.appService.getHealthCheck();
  }
}
