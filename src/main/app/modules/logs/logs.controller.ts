import { Controller, Get, Param } from '@nestjs/common'
import { LogsService } from './logs.service'

@Controller('/logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get('/:jobId')
  async getLogs(@Param('jobId') jobId: string) {
    return {
      logs: await this.logsService.getLogs(jobId),
    }
  }
}
