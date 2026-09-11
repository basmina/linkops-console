import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const swaggerOptions = new DocumentBuilder()
      .setTitle('LinkOps API')
      .setDescription('API documentation for the LinkOps application')
      .setVersion('1.0')
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerOptions);

    SwaggerModule.setup('/api/docs', app, swaggerDocument);
  }

  const port = process.env.PORT ?? 3000;

  await app.listen(port);
}

void bootstrap();
