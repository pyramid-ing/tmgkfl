import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'
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

  @Post('/')
  async create(@Body() postJobsCreateReqDto: PostJobsCreateReqDto) {
    return this.postJobsService.createPostJobs(postJobsCreateReqDto)
  }

  @Delete('/:id')
  async delete(@Param('id') id: number) {
    return this.postJobsService.deletePostJob(id)
  }

  @Post('/:id/retry')
  async retry(@Param('id') id: number) {
    return this.postJobsService.retryPostJob(id)
  }
}
