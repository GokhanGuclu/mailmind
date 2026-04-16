import { Module } from '@nestjs/common';
import { TasksController } from './presentation/tasks.controller';
import { TasksService } from './application/tasks.service';

@Module({
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
