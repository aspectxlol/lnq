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

async function bootstrap() {
  const adapter = new FastifyAdapter();

  // Get the underlying Fastify instance and register cookie plugin
  const fastifyInstance = adapter.getInstance();

  // Register the cookie plugin directly on the Fastify instance
  // The plugin type doesn't match Fastify's expected signature due to library type definitions,
  // but it's compatible at runtime. We cast through unknown to safely bridge this gap.
  await fastifyInstance.register(
    fastifyCookie as unknown as Parameters<typeof fastifyInstance.register>[0],
    { secret: process.env.COOKIE_SECRET || "development-secret" },
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

  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle("LnQ Commerce API")
    .setDescription("The LnQ Commerce API specification")
    .setVersion("1.0")
    .setContact("Louie", "louie.is-a.dev", "gamernxt6@gmail.com")
    .setLicense("MIT", "https://opensource.org/licenses/MIT")
    .addBearerAuth({
      type: "apiKey",
      name: "access-token",
    })
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, documentFactory);

  await app.listen({
    port: process.env.PORT ? parseInt(process.env.PORT) : 3001,
    host: process.env.HOST || "0.0.0.0",
  });
}

void bootstrap();
