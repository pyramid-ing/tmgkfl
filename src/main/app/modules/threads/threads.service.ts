import { PrismaService } from '@main/app/modules/common/prisma/prisma.service'
import { retry } from '@main/app/utils/retry'
import { Injectable, Logger } from '@nestjs/common'
import { shuffle } from 'lodash'
import { createHash } from 'node:crypto'
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

    const processedArticles = new Set()

    try {
      await retry(
        async () => {
          let browser, context, page

          try {
            this.logging(jobId, '자동화 작업을 시작합니다.')
            const launchResult = await this.workflowService.launch(!appSettings.showBrowserWindow)
            browser = launchResult.browser
            context = launchResult.context
            page = await context.newPage()

            this.logging(jobId, 'Threads 로그인을 시도합니다')
            await this.workflowService.login(page, { id, pw })

            this.logging(jobId, '검색 결과 페이지로 이동합니다')
            await this.workflowService.gotoSearch(page)

            this.logging(jobId, '검색을 시작합니다')
            await this.workflowService.search(page, keyword)

            const articleSelector = 'div[data-interactive-id]'
            this.logging(jobId, '게시물을 찾습니다')
            await this.workflowService.waitArticles(page, articleSelector)

            this.logging(jobId, `처리된 게시물 수: ${processedArticles.size}, 목표: ${maxCount}`)

            while (processedArticles.size < maxCount) {
              const articles = await page.$$(articleSelector)
              let processedInThisRound = 0

              for (const article of articles) {
                if (processedArticles.size >= maxCount) {
                  break
                }

                const desc = await article.$('div > div:nth-child(3) > div > div:nth-child(1)')
                const descText = await desc?.textContent()
                let articlaHash = ''
                try {
                  articlaHash = createHash('md5').update(descText).digest('hex')
                } catch (err) {
                  // 간혹 오류 발생하는 경우있어서 skip
                  continue
                }

                if (processedArticles.has(articlaHash)) {
                  continue
                }
                await page.evaluate(el => {
                  el.scrollIntoView({ behavior: 'smooth' })
                }, article)
                await page.waitForTimeout(1000)

                const articleText = `[${descText?.slice(0, 20)}...]`
                this.logging(jobId, `${articleText} 게시물을 처리합니다. (${processedArticles.size} / ${maxCount})`)

                // 먼저 모든 액션의 상태를 확인하여 이미 처리된 게시물인지 판단
                let isAlreadyProcessed = false

                if (followAction) {
                  const isAlreadyFollowed = await this.workflowService.isAlreadyFollowed(
                    article as unknown as ElementHandle<HTMLDivElement>,
                  )
                  if (isAlreadyFollowed) {
                    isAlreadyProcessed = true
                  }
                }

                if (likeAction && !isAlreadyProcessed) {
                  const isAlreadyLiked = await this.workflowService.isAlreadyLiked(
                    article as unknown as ElementHandle<HTMLDivElement>,
                  )
                  if (isAlreadyLiked) {
                    isAlreadyProcessed = true
                  }
                }

                if (repostAction && !isAlreadyProcessed) {
                  const isAlreadyReposted = await this.workflowService.isAlreadyReposted(
                    page,
                    article as unknown as ElementHandle<HTMLDivElement>,
                  )
                  if (isAlreadyReposted) {
                    isAlreadyProcessed = true
                  }
                }

                // 이미 처리된 게시물이면 스킵
                if (isAlreadyProcessed) {
                  this.logging(jobId, `${articleText} 이미 처리된 게시물 - 전체 스킵`)
                  processedArticles.add(articlaHash)
                  processedInThisRound++
                  continue
                }

                // 1. 댓글 액션 (가장 먼저)
                if (commentAction) {
                  const filteredFollowMessages = followMessages.filter(message => message.trim() !== '')
                  if (filteredFollowMessages.length === 0) {
                    this.logging(jobId, `멘트가 없어 댓글을 작성하지 않습니다.`)
                    await page.waitForTimeout(this.getRandomDelay(minDelay, maxDelay) * 1000)
                  } else {
                    this.logging(jobId, `${articleText} 댓글을 시도합니다`)
                    try {
                      await this.workflowService.commentArticle(
                        page,
                        article as unknown as ElementHandle<HTMLDivElement>,
                        shuffle(filteredFollowMessages)[0],
                      )
                      this.logging(jobId, `${articleText} 댓글 성공`)
                      await page.waitForTimeout(this.getRandomDelay(minDelay, maxDelay) * 1000)
                    } catch (err) {
                      this.logging(jobId, `${articleText} 댓글 결과: ${err.message}`)
                      await page.waitForTimeout(this.getRandomDelay(minDelay, maxDelay) * 1000)
                    }
                  }
                }

                // 2. 팔로우 액션
                if (followAction) {
                  const isAlreadyFollowed = await this.workflowService.isAlreadyFollowed(
                    article as unknown as ElementHandle<HTMLDivElement>,
                  )
                  if (isAlreadyFollowed) {
                    this.logging(jobId, `${articleText} 이미 팔로우된 사용자 - 스킵`)
                  } else {
                    this.logging(jobId, `${articleText} 팔로우를 시도합니다`)
                    try {
                      await this.workflowService.followArticle(
                        page,
                        article as unknown as ElementHandle<HTMLDivElement>,
                      )
                      this.logging(jobId, `${articleText} 팔로우 성공`)
                      await page.waitForTimeout(this.getRandomDelay(minDelay, maxDelay) * 1000)
                    } catch (err) {
                      this.logging(jobId, `${articleText} 팔로우 결과: ${err.message}`)
                      await page.waitForTimeout(this.getRandomDelay(minDelay, maxDelay) * 1000)
                    }
                  }
                }

                // 3. 좋아요 액션
                if (likeAction) {
                  const isAlreadyLiked = await this.workflowService.isAlreadyLiked(
                    article as unknown as ElementHandle<HTMLDivElement>,
                  )

                  if (isAlreadyLiked) {
                    this.logging(jobId, `${articleText} 이미 좋아요된 게시물 - 스킵`)
                  } else {
                    this.logging(jobId, `${articleText} 좋아요를 시도합니다`)
                    try {
                      await this.workflowService.likeArticle(page, article as unknown as ElementHandle<HTMLDivElement>)
                      this.logging(jobId, `${articleText} 좋아요 성공`)
                      await page.waitForTimeout(this.getRandomDelay(minDelay, maxDelay) * 1000)
                    } catch (err) {
                      this.logging(jobId, `${articleText} 좋아요 결과: ${err.message}`)
                      await page.waitForTimeout(this.getRandomDelay(minDelay, maxDelay) * 1000)
                    }
                  }
                }

                // 4. 리포스트 액션
                if (repostAction) {
                  const isAlreadyReposted = await this.workflowService.isAlreadyReposted(
                    page,
                    article as unknown as ElementHandle<HTMLDivElement>,
                  )
                  if (isAlreadyReposted) {
                    this.logging(jobId, `${articleText} 이미 리포스트된 게시물 - 스킵`)
                  } else {
                    this.logging(jobId, `${articleText} 리포스트를 시도합니다`)
                    try {
                      await this.workflowService.repostArticle(
                        page,
                        article as unknown as ElementHandle<HTMLDivElement>,
                      )
                      this.logging(jobId, `${articleText} 리포스트 성공`)
                      await page.waitForTimeout(this.getRandomDelay(minDelay, maxDelay) * 1000)
                    } catch (err) {
                      this.logging(jobId, `${articleText} 리포스트 결과: ${err.message}`)
                      await page.waitForTimeout(this.getRandomDelay(minDelay, maxDelay) * 1000)
                    }
                  }
                }

                processedArticles.add(articlaHash)
                processedInThisRound++
              }

              // 이번 라운드에서 처리된 게시물이 없으면 스크롤하여 더 많은 게시물 로드
              if (processedInThisRound === 0) {
                this.logging(jobId, '새로운 게시물을 찾기 위해 스크롤합니다')
                await page.evaluate(() => {
                  window.scrollBy(0, window.innerHeight)
                })
                await page.waitForTimeout(2000)
              }
            }

            this.logging(jobId, '자동화 작업이 성공적으로 완료되었습니다.')
            await browser.close()
          } catch (error: any) {
            // 브라우저가 종료된 경우 재시작하지 않고 작업 종료
            if (error.message.includes('Target page, context or browser has been closed')) {
              this.logging(jobId, '브라우저가 종료되었습니다. 작업을 중단합니다.')
              this.logging(jobId, `최종 처리된 게시물 수: ${processedArticles.size}`)
              return
            }

            // 브라우저 정리
            try {
              if (browser) {
                await browser.close()
              }
            } catch (closeError) {
              this.logging(jobId, `브라우저 종료 중 오류: ${closeError.message}`)
            }
            throw error
          }
        },
        5000, // 5초 간격
        10, // 최대 10회 재시도
        'exponential', // 지수 백오프
      )
    } catch (error: any) {
      console.error(error)

      this.logging(jobId, `최대 재시도 횟수(10회)에 도달했습니다. 작업을 중단합니다.`)
      this.logging(jobId, `최종 처리된 게시물 수: ${processedArticles.size}`)
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
        // 4바이트(UTF-16 surrogate pair) 문자 제거
        message: message
          .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '') // 4바이트 문자
          .replace(/[\x00-\x1F\x7F]/g, ''), // 제어문자
      },
    })
  }
}
