import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse,ApiOperation, ApiTags } from "@nestjs/swagger";

import { AppService } from "./app.service";
import { HealthResponseDto } from "./app/dto/health-response.dto";

@ApiTags("Root")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/health")
  @ApiOperation({ summary: "Health check endpoint" })
  @ApiOkResponse({
    description: "Service health status",
    type: HealthResponseDto,
  })
  healthcheck() {
    return this.appService.getHealthCheck();
  }
}
