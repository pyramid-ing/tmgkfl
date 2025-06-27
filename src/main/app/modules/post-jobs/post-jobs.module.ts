import { Module } from '@nestjs/common'
import { WorkflowModule } from '../workflow/workflow.module'
import { PostJobsController } from './post-jobs.controller'
import { PostJobsProcessor } from './post-jobs.processor'
import { PostJobsService } from './post-jobs.service'

@Module({
  imports: [WorkflowModule],
  controllers: [PostJobsController],
  providers: [PostJobsService, PostJobsProcessor],
  exports: [PostJobsService],
})
export class PostJobsModule {}
