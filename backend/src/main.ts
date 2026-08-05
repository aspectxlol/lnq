import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookie from "@fastify/cookie";
import { ConsoleLogger } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
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

  app.register(cookie, {
    secret: process.env.COOKIE_SECRET,
    parseOptions: {},
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
