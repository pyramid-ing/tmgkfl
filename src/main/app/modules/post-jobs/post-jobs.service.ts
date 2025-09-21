import { PrismaService } from '@main/app/modules/common/prisma/prisma.service'
import { EnvConfig } from '@main/config/env.config'
import { Injectable } from '@nestjs/common'
import { PostJob } from '@prisma/client'
import { groupBy } from 'lodash'
import { BrowserContext } from 'playwright'
import { ChromeNotInstalledError, WorkflowService } from '../workflow/workflow.service'
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
    // 빈 데이터 필터링: desc가 비어있거나 scheduledAt이 유효하지 않은 데이터 제외
    const validPosts = postJobsCreateReqDto.posts.filter(post => {
      return post.desc && post.desc.trim() !== '' && post.scheduledAt
    })

    if (validPosts.length === 0) {
      throw new Error('유효한 게시글 데이터가 없습니다. 모든 데이터가 비어있거나 필수 정보가 누락되었습니다.')
    }

    const datas = validPosts.map(post => ({
      ...post,
      loginId: postJobsCreateReqDto.loginId,
      loginPw: postJobsCreateReqDto.loginPw,
      status: 'pending',
    }))

    const result = await this.prisma.postJob.createMany({
      data: datas,
    })

    return {
      ...result,
      message: `${validPosts.length}개의 게시글이 성공적으로 예약되었습니다. (빈 데이터 ${postJobsCreateReqDto.posts.length - validPosts.length}개 자동 제외)`,
    }
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
      let browser, context
      try {
        const launchResult = await this.workflowService.launch(
          EnvConfig.isPackaged, // background (개발환경에서는 디버깅용으로 비활성화)
        )
        browser = launchResult.browser
        context = launchResult.context
      } catch (error) {
        if (error instanceof ChromeNotInstalledError) {
          // 크롬 설치 에러인 경우 모든 작업을 실패로 처리
          await this.prisma.postJob.updateMany({
            where: {
              id: {
                in: postJobs.map(postJob => postJob.id),
              },
            },
            data: {
              status: 'failed',
              resultMsg: 'CHROME_NOT_INSTALLED: ' + error.message,
            },
          })
          return // 크롬 설치 에러는 재시도하지 않고 즉시 종료
        }
        throw error // 다른 에러는 그대로 전파
      }

      try {
        const postJobs = groupedPostJobs[loginId]

        const page = await context.newPage()
        await this.workflowService.login(page, { id: loginId, pw: postJobs[0].loginPw })

        for (const postJob of postJobs) {
          await this.handlePostJob(context, postJob)
        }
      } catch (error) {
        console.error(error)

        // 크롬 설치 에러인 경우 특별 처리
        if (error instanceof ChromeNotInstalledError) {
          await this.prisma.postJob.updateMany({
            where: {
              id: {
                in: postJobs.map(postJob => postJob.id),
              },
            },
            data: {
              status: 'failed',
              resultMsg: 'CHROME_NOT_INSTALLED: ' + error.message,
            },
          })
        } else {
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
        }
      } finally {
        if (browser) {
          await browser.close()
        }
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
