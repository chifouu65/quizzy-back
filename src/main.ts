import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Garde uniquement la configuration CORS
  app.enableCors({
    origin: 'http://localhost:4200',
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Authorization, Content-Type',
  });

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Server running on port ${process.env.PORT ?? 3000}`);
}

bootstrap();
