import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  console.log(`✅ Leaderboard API listening on port ${port}`);
  console.log(`📊 GET http://localhost:${port}/leaderboard`);
  console.log(`📝 POST http://localhost:${port}/score`);
  console.log(`🏥 GET http://localhost:${port}/health`);
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start application:', err);
  process.exit(1);
});
