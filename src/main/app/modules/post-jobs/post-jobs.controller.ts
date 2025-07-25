import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common'
import { AuthGuard, Permissions } from '../auth/auth.guard'
import { PostJobsCreateReqDto } from './dto/post-jobs.create.dto'
import { PostJobsService } from './post-jobs.service'

@Controller('/post-jobs')
export class PostJobsController {
  constructor(private readonly postJobsService: PostJobsService) {}

  @Get('/')
  async list() {
    return {
      postJobs: await this.postJobsService.getPostJobs(),
    }
  }

  @UseGuards(AuthGuard)
  @Permissions('posting')
  @Post('/')
  async create(@Body() postJobsCreateReqDto: PostJobsCreateReqDto) {
    return this.postJobsService.createPostJobs(postJobsCreateReqDto)
  }
  @UseGuards(AuthGuard)
  @Permissions('posting')
  @Delete('/:id')
  async delete(@Param('id') id: number) {
    return this.postJobsService.deletePostJob(id)
  }
  @UseGuards(AuthGuard)
  @Permissions('posting')
  @Post('/:id/retry')
  async retry(@Param('id') id: number) {
    return this.postJobsService.retryPostJob(id)
  }
}
