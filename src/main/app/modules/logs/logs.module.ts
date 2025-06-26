import { Module } from '@nestjs/common'
import { LogsController } from './logs.controller'
import { LogsService } from './logs.service'
import { PrismaService } from '../../shared/prisma.service'

@Module({
  imports: [],
  controllers: [LogsController],
  providers: [PrismaService, LogsService],
})
export class LogsModule {}
