import './tracer/tracer';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ErrorInterceptor } from './common/interceptors/error.interceptor';
import { ApiMessages } from './common/messages/api-messages';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new ErrorInterceptor());

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle(ApiMessages.Documentation.ApiTitle)
    .setDescription(ApiMessages.Documentation.ApiDescription)
    .setVersion(ApiMessages.Documentation.ApiVersion)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
