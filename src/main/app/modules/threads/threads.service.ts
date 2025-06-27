import { PrismaService } from '@main/app/modules/common/prisma/prisma.service'
import { Injectable, Logger } from '@nestjs/common'
import { shuffle } from 'lodash'
import { ElementHandle } from 'playwright'
import { SettingsService } from '../settings/settings.service'
import { WorkflowService } from '../workflow/workflow.service'
import { ThreadsFollowDto } from './dto/threads-follow.dto'

@Injectable()
export class ThreadsService {
  private readonly logger = new Logger(ThreadsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly workflowService: WorkflowService,
  ) {}

  async getPostJobs() {
    return this.prisma.postJob.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async startAutomation(jobId: string, threadsFollowDto: ThreadsFollowDto) {
    const appSettings = await this.settingsService.getAppSettings()
    const {
      id,
      pw,
      keyword,
      minDelay,
      maxDelay,
      followMessages,
      followAction,
      likeAction,
      repostAction,
      commentAction,
      maxCount,
    } = threadsFollowDto

    this.logging(jobId, `Threads 자동화 작업을 시작합니다. 키워드: ${keyword}`)
    const { browser, context } = await this.workflowService.launch(!appSettings.showBrowserWindow)

    const page = await context.newPage()

    try {
      this.logging(jobId, 'Threads 로그인을 시도합니다')
      await this.workflowService.login(page, { id, pw })

      this.logging(jobId, '검색 결과 페이지로 이동합니다')
      await this.workflowService.gotoSearch(page)

      this.logging(jobId, '검색을 시작합니다')
      await this.workflowService.search(page, keyword)

      const articleSelector = 'div[data-interactive-id]'
      this.logging(jobId, '게시물을 찾습니다')
      await this.workflowService.waitArticles(page, articleSelector)

      let articles = await page.$$(articleSelector)

      let currentArticleIndex = 0
      let processedCount = 0
      while (processedCount < maxCount) {
        if (currentArticleIndex >= articles.length) {
          articles = await page.$$(articleSelector)
          currentArticleIndex = 0
        }
        const article = articles[processedCount]
        if (!article) {
          this.logging(jobId, '게시물을 찾지 못했습니다')
          break
        }
        await page.evaluate(el => {
          el.scrollIntoView({ behavior: 'smooth' })
        }, article)
        await page.waitForTimeout(1000)

        currentArticleIndex++
        processedCount++
        const desc = await article.$('div > div:nth-child(3) > div > div:nth-child(1)')
        const descText = await desc?.textContent()
        const articleText = `[${descText?.slice(0, 20)}...]`
        this.logging(jobId, `${articleText} 게시물을 처리합니다. (${processedCount} / ${maxCount})`)

        if (followAction) {
          this.logging(jobId, `${articleText} 팔로우를 시도합니다`)
          try {
            await this.workflowService.followArticle(page, article as unknown as ElementHandle<HTMLDivElement>)
            this.logging(jobId, `${articleText} 팔로우 성공`)
          } catch (err) {
            this.logging(jobId, `${articleText} 팔로우 결과: ${err.message}`)
          }
          await page.waitForTimeout(this.getRandomDelay(minDelay, maxDelay) * 1000)
        }
        if (likeAction) {
          this.logging(jobId, `${articleText} 좋아요를 시도합니다`)
          try {
            await this.workflowService.likeArticle(page, article as unknown as ElementHandle<HTMLDivElement>)
            this.logging(jobId, `${articleText} 좋아요 성공`)
          } catch (err) {
            this.logging(jobId, `${articleText} 좋아요 결과: ${err.message}`)
          }
          await page.waitForTimeout(this.getRandomDelay(minDelay, maxDelay) * 1000)
        }
        if (repostAction) {
          try {
            this.logging(jobId, `${articleText} 리포스트를 시도합니다`)
            await this.workflowService.repostArticle(page, article as unknown as ElementHandle<HTMLDivElement>)
            this.logging(jobId, `${articleText} 리포스트 성공`)
          } catch (err) {
            this.logging(jobId, `${articleText} 리포스트 결과: ${err.message}`)
          }
          await page.waitForTimeout(this.getRandomDelay(minDelay, maxDelay) * 1000)
        }
        if (commentAction) {
          this.logging(jobId, `${articleText} 댓글을 시도합니다`)
          const filteredFollowMessages = followMessages.filter(message => message.trim() !== '')
          if (filteredFollowMessages.length === 0) {
            this.logging(jobId, `멘트가 없어 댓글을 작성하지 않습니다.`)
          } else {
            try {
              await this.workflowService.commentArticle(
                page,
                article as unknown as ElementHandle<HTMLDivElement>,
                shuffle(filteredFollowMessages)[0],
              )
              this.logging(jobId, `${articleText} 댓글 성공`)
            } catch (err) {
              this.logging(jobId, `${articleText} 댓글 결과: ${err.message}`)
            }
          }
          await page.waitForTimeout(this.getRandomDelay(minDelay, maxDelay) * 1000)
        }
      }

      this.logging(jobId, '자동화 작업이 성공적으로 완료되었습니다.')
      await browser.close()
    } catch (error: any) {
      console.error(error)
      this.logging(jobId, '자동화 작업 중 오류 혹은 사용자 취소가 발생했습니다.')
      await browser.close()
    }
  }

  private getRandomDelay(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  async logging(jobId: string, message: string) {
    this.logger.log(`[${jobId}] ${message}`)
    await this.prisma.log.create({
      data: {
        jobId,
        message,
      },
    })
  }
}
