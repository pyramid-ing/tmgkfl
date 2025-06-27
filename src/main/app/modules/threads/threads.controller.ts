import { Body, Controller, Post } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { ThreadsFollowDto } from './dto/threads-follow.dto'
import { ThreadsService } from './threads.service'

@Controller('/threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Post('/start')
  async startAutomation(
    @Body()
    ThreadsFollowDto: ThreadsFollowDto,
  ) {
    const jobId = randomUUID()
    this.threadsService.startAutomation(jobId, ThreadsFollowDto)
    return { jobId, message: 'Threads 자동화를 시작합니다.' }
  }
}
