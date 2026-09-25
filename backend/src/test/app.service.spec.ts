import { ServiceUnavailableException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { AppService } from "../app.service";
import { DrizzleService } from "../db/drizzle.service";

describe("AppService", () => {
  let service: AppService;
  let drizzle: { db: { select: jest.Mock } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: DrizzleService,
          useValue: { db: { select: jest.fn() } },
        },
      ],
    }).compile();

    service = module.get(AppService);
    drizzle = module.get(DrizzleService);
  });

  it("should report a healthy database", async () => {
    drizzle.db.select.mockResolvedValue([]);

    await expect(service.getHealthCheck()).resolves.toEqual({
      status: 200,
      message: "ok",
      database: "ok",
    });
  });

  it("should return an actual service-unavailable error when the database check fails", async () => {
    drizzle.db.select.mockRejectedValue(new Error("Database unavailable"));

    await expect(service.getHealthCheck()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
