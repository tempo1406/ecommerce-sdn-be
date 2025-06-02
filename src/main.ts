import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend requests
  app.enableCors({
    origin: '*', // Allow all origins or specify multiple: ['http://localhost:3000', 'http://localhost:5173']
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  // Increase payload size limits for file uploads
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
  
  // Set global API prefix
  app.setGlobalPrefix('api');
  
  // Start the server
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
