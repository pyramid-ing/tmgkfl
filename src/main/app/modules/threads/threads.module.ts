import { Module } from '@nestjs/common'
import { SettingsModule } from '../settings/settings.module'
import { WorkflowModule } from '../workflow/workflow.module'
import { ThreadsController } from './threads.controller'
import { ThreadsService } from './threads.service'

@Module({
  imports: [SettingsModule, WorkflowModule],
  controllers: [ThreadsController],
  providers: [ThreadsService],
})
export class ThreadsModule {}
