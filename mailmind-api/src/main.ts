import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,            // @Type decorators work (string → number etc.)
      whitelist: true,             // strip unknown properties
      forbidNonWhitelisted: false, // don't throw on extra props
    }),
  );

  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:8081')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.enableShutdownHooks();

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);
}
bootstrap();