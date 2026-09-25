import "dotenv/config";

import { ConsoleLogger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import fastifyCookie from "@fastify/cookie";

import { AppModule } from "./app.module";
import { validateEnv } from "./env";
import { ZodValidationPipe } from "nestjs-zod";

async function bootstrap() {
  const env = validateEnv();
  const adapter = new FastifyAdapter();
  const cookieSecret = env.COOKIE_SECRET;

  const fastifyInstance = adapter.getInstance();
  await fastifyInstance.register(
    fastifyCookie as unknown as Parameters<typeof fastifyInstance.register>[0],
    { secret: cookieSecret },
  );

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    {
      logger: new ConsoleLogger({
        prefix: "Backend",
      }),
    },
  );
  app.useGlobalPipes(new ZodValidationPipe());
  app.enableCors({
    origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",") : false,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle("LnQ Commerce API")
    .setDescription("The LnQ Commerce API specification")
    .setVersion("1.0")
    .setContact("Louie", "louie.is-a.dev", "gamernxt6@gmail.com")
    .setLicense("MIT", "https://opensource.org/licenses/MIT")
    .addBearerAuth({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    })
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, documentFactory);

  await app.listen({
    port: env.PORT,
    host: env.HOST,
  });
}

void bootstrap();
