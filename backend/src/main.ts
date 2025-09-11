import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.enableCors();

  const uploadsPath = join(__dirname, '..', 'uploads');
  console.log('Serving uploads from:', uploadsPath);
  app.use('/uploads', express.static(uploadsPath));

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('JEB Incubator API')
    .setDescription('API for JEB Incubator platform')
    .setVersion('1.0')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Backend running on http://localhost:${port}`);
  console.log(`API Docs: http://localhost:${port}/docs`);
  console.log(`Health check: http://localhost:${port}/api/health`);
}

bootstrap();