import { PrismaService } from '@main/app/modules/common/prisma/prisma.service'
import { EnvConfig } from '@main/config/env.config'
import { Injectable } from '@nestjs/common'
import { PostJob } from '@prisma/client'
import { groupBy } from 'lodash'
import { BrowserContext } from 'playwright'
import { WorkflowService } from '../workflow/workflow.service'
import { PostJobsCreateReqDto } from './dto/post-jobs.create.dto'

@Injectable()
export class PostJobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowService: WorkflowService,
  ) {}

  async getPostJobs() {
    return this.prisma.postJob.findMany({
      orderBy: {
        id: 'desc',
      },
    })
  }

  async createPostJobs(postJobsCreateReqDto: PostJobsCreateReqDto) {
    const datas = postJobsCreateReqDto.posts.map(post => ({
      ...post,
      loginId: postJobsCreateReqDto.loginId,
      loginPw: postJobsCreateReqDto.loginPw,
      status: 'pending',
    }))
    return await this.prisma.postJob.createMany({
      data: datas,
    })
  }

  async deletePostJob(id: number) {
    return await this.prisma.postJob.delete({
      where: { id },
    })
  }

  async retryPostJob(id: number) {
    return await this.prisma.postJob.update({
      where: { id, status: 'failed' },
      data: {
        status: 'pending',
        resultMsg: null,
      },
    })
  }

  async processPostJobs() {
    const postJobs = await this.prisma.postJob.findMany({
      where: {
        status: 'pending',
        scheduledAt: {
          lte: new Date(),
        },
      },
    })
    await this.prisma.postJob.updateMany({
      where: {
        id: {
          in: postJobs.map(postJob => postJob.id),
        },
      },
      data: {
        status: 'processing',
      },
    })

    const groupedPostJobs = groupBy(postJobs, postJob => postJob.loginId)
    for (const loginId in groupedPostJobs) {
      const { browser, context } = await this.workflowService.launch(
        EnvConfig.isPackaged, // background (개발환경에서는 디버깅용으로 비활성화)
      )
      try {
        const postJobs = groupedPostJobs[loginId]

        const page = await context.newPage()
        await this.workflowService.login(page, { id: loginId, pw: postJobs[0].loginPw })

        for (const postJob of postJobs) {
          await this.handlePostJob(context, postJob)
        }
      } catch (error) {
        console.error(error)
        await this.prisma.postJob.updateMany({
          where: {
            id: {
              in: postJobs.map(postJob => postJob.id),
            },
          },
          data: {
            status: 'failed',
            resultMsg: error.message,
          },
        })
      } finally {
        await browser.close()
      }
    }
  }

  async handlePostJob(context: BrowserContext, postJob: PostJob) {
    const page = await context.newPage()
    try {
      await page.goto('https://www.threads.com')
      await page.waitForTimeout(3000)
      await this.workflowService.postArticle(page, postJob.subject, postJob.desc)
      await this.prisma.postJob.update({
        where: {
          id: postJob.id,
        },
        data: {
          status: 'completed',
          postedAt: new Date(),
        },
      })
    } catch (error) {
      console.error(error)
      await this.prisma.postJob.update({
        where: {
          id: postJob.id,
        },
        data: {
          status: 'failed',
          resultMsg: error.message,
        },
      })
    } finally {
      await page.close()
    }
  }

  async removeUnprocessedPostJobs() {
    await this.prisma.postJob.updateMany({
      where: {
        status: 'processing',
      },
      data: {
        status: 'failed',
        resultMsg: '작업 중 프로그램 종료됨',
      },
    })
  }
}
