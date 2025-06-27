import { Module } from '@nestjs/common'
import { WorkflowService } from './workflow.service'

@Module({
  imports: [],
  controllers: [],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
