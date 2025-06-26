import { Module } from '@nestjs/common'
import { ThreadsController } from './api/threads.controller'
import { ThreadsService } from './workflow/threads.service'
import { PrismaService } from '@main/app/shared/prisma.service'
import { SettingsModule } from '../settings/settings.module'

@Module({
  imports: [SettingsModule],
  controllers: [ThreadsController],
  providers: [PrismaService, ThreadsService],
})
export class ThreadsModule {}
