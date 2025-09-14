import { Body, Controller, HttpException, HttpStatus, Post, UseGuards } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { AuthGuard, Permissions } from '../auth/auth.guard'
import { ChromeNotInstalledError } from '../workflow/workflow.service'
import { ThreadsFollowDto } from './dto/threads-follow.dto'
import { ThreadsService } from './threads.service'

@Controller('/threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Post('/start')
  @UseGuards(AuthGuard)
  @Permissions('tmgkfl')
  async startAutomation(
    @Body()
    ThreadsFollowDto: ThreadsFollowDto,
  ) {
    const jobId = randomUUID()
    try {
      this.threadsService.startAutomation(jobId, ThreadsFollowDto)
      return { jobId, message: 'Threads 자동화를 시작합니다.' }
    } catch (error) {
      if (error instanceof ChromeNotInstalledError) {
        throw new HttpException(
          {
            message: error.message,
            errorCode: 'CHROME_NOT_INSTALLED',
          },
          HttpStatus.BAD_REQUEST,
        )
      }
      throw error
    }
  }
}
