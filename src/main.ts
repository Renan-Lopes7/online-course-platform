import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Plataforma de Cursos API')
    .setDescription('Documentação dos endpoints da plataforma de cursos')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: [
      'http://localhost:3001',
      'https://online-course-platform-1-z6a2.onrender.com',
    ],
  });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
