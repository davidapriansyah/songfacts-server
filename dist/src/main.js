"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    // Global prefix
    app.setGlobalPrefix('api');
    // CORS
    app.enableCors({
        origin: [process.env.FRONTEND_URL, 'http://localhost:5173'].filter((s) => !!s),
        credentials: true,
    });
    // Validation pipe
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    // Swagger documentation
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Songfacts API')
        .setDescription('API for Songfacts application - Music facts & recommendations')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('auth', 'Authentication endpoints')
        .addTag('songs', 'Song management')
        .addTag('bands', 'Band information')
        .addTag('favorites', 'User favorites')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map