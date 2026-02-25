import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';
import { IamModule } from './modules/iam/iam.module';

@Module({
  imports: [PrismaModule, IamModule],
  controllers: [HealthController],
})
export class AppModule {}