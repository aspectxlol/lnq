import { Test, type TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

jest.mock("./auth.service", () => ({
  AuthService: class {},
}));

jest.mock("../prisma/prisma.service", () => ({
  PrismaService: class {},
}));

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

describe("Swagger auth docs", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            registerLocal: jest.fn(),
            refreshAccessToken: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("exposes a request body schema for auth registration", () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle("Test API").setVersion("1.0").build(),
    );

    const registrationPath = document.paths["/auth/register"]?.post;

    expect(registrationPath?.requestBody).toBeDefined();
    expect(
      registrationPath?.requestBody?.content?.["application/json"].schema
        ?.properties,
    ).toEqual(
      expect.objectContaining({
        firstName: expect.anything(),
        email: expect.anything(),
        password: expect.anything(),
      }),
    );
  });

  afterEach(async () => {
    await app.close();
  });
});
