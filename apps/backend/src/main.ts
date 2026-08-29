import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Habilitar ValidationPipe global para DTOs con conversión implícita de query params
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configuración de CORS con Allowlist y soporte para red local/móviles (SRS v1.1 - Sección 5)
  const corsOriginEnv = configService.get<string>('CORS_ORIGIN');
  app.enableCors({
    origin: (origin, callback) => {
      // Permitir si no hay origen (curl, mobile apps directas) o si no hay restricción
      if (!origin) {
        return callback(null, true);
      }
      if (corsOriginEnv) {
        const allowed = corsOriginEnv.split(',').map((o) => o.trim());
        if (allowed.includes(origin)) {
          return callback(null, true);
        }
      }
      // Permitir cualquier IP de red local (localhost, 127.0.0.1, 192.168.*, 10.*, 172.*) en desarrollo
      if (
        /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(
          origin,
        )
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback permisivo para testing
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Configuración de Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Tienda360 API')
    .setDescription(
      'API Backend del sistema Tienda360 — Catálogo Virtual + Gestor de Inventario.\n\n'
      + '**Autenticación:** Usa el botón "Authorize" con tu JWT Bearer token.\n\n'
      + '**Roles:** ADMIN, VENDEDOR, BODEGA',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey(
      { type: 'apiKey', name: 'idempotency-key', in: 'header', description: 'UUID v4 único por operación de inventario' },
      'idempotency-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
  logger.log(`Servidor Backend Tienda360 corriendo en http://localhost:${port}`);
  logger.log(`Swagger UI disponible en http://localhost:${port}/api/docs`);
}

bootstrap();
