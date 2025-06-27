import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PostJobsService } from './post-jobs.service'

@Injectable()
export class PostJobsProcessor {
  constructor(private readonly postJobsService: PostJobsService) {
    // 프로그램 최초 실행시 남아있는 처리중인 작업 취소
    void this.removeUnprocessedPostJobs()
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleCron() {
    await this.postJobsService.processPostJobs()
  }

  async removeUnprocessedPostJobs() {
    await this.postJobsService.removeUnprocessedPostJobs()
  }
}
