import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ErrorInterceptor } from './common/interceptors/error.interceptor';
import { ApiMessages } from './common/messages/api-messages';
import { lokiLogger } from './common/logger/loki-logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await lokiLogger.info('Application starting');

  app.useGlobalFilters(new ErrorInterceptor());
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle(ApiMessages.Documentation.ApiTitle)
    .setDescription(ApiMessages.Documentation.ApiDescription)
    .setVersion(ApiMessages.Documentation.ApiVersion)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);
  await lokiLogger.info(
    `Application started successfully on ports: ${process.env.PORT || 3000}`,
  );
}

bootstrap().catch(async (error) => {
  await lokiLogger.error('Application failed to start', error);
});
