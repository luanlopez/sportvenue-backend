import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*', // Ou especifique uma origem específica, se necessário
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept',
    credentials: false, // Se você estiver usando cookies ou autenticação
  });

  const config = new DocumentBuilder()
    .setTitle('SportVenue API')
    .setDescription(
      'API for managing and locating sports venues. Allows users to view, search, and book sports courts, including detailed information about each venue such as address, available hours, and operational status.',
    )
    .setVersion('1.0')
    .addTag('venues')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
