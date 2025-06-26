import { Injectable, Logger } from '@nestjs/common'
import { chromium, ElementHandle, Page } from 'playwright'
import { ThreadsFollowDto } from '../api/dto/threads-follow.dto'
import { PrismaService } from '@main/app/shared/prisma.service'
import { SettingsService } from '../../settings/settings.service'
import os from 'os'

@Injectable()
export class ThreadsService {
  private readonly logger = new Logger(ThreadsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  async startAutomation(jobId: string, threadsFollowDto: ThreadsFollowDto) {
    const appSettings = await this.settingsService.getAppSettings()
    const {
      id,
      pw,
      keyword,
      minDelay,
      maxDelay,
      followMessage,
      followAction,
      likeAction,
      repostAction,
      commentAction,
    } = threadsFollowDto

    this.logging(jobId, `Threads 자동화 작업을 시작합니다. 키워드: ${keyword}`)
    const browser = await chromium.launch({
      headless: !appSettings.showBrowserWindow,
      executablePath: this.getChromiumExecutablePath(),
    })
    const context = await browser.newContext({
      viewport: { width: 393, height: 852 },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    })
    // 세션 스토리지 초기화
    await context.addInitScript(() => {
      window.sessionStorage.clear()
      window.sessionStorage.setItem('barcelona_mobile_upsell_state', '1')
    })
    const page = await context.newPage()

    try {
      await page.goto('https://www.threads.com/login/')
      this.logging(jobId, 'Threads 로그인 페이지 접속')
      await page.waitForTimeout(3000)

      const loginButtonSelector = 'a[role="link"]'
      await page.waitForSelector(loginButtonSelector, { timeout: 30000 })
      const loginButton = await page.$(loginButtonSelector)
      if (loginButton) {
        await loginButton.click()
      } else {
        throw new Error('로그인 버튼 찾을 수 없음')
      }

      await page.waitForSelector('input[autocomplete="username"]')
      this.logging(jobId, '로그인 정보를 입력합니다.')
      await page.waitForTimeout(3000)
      await page.fill('input[autocomplete="username"]', id)
      await page.fill('input[autocomplete="current-password"]', pw)
      const passwordInput = await page.$('input[autocomplete="current-password"]')
      const parentElement = await passwordInput?.$('xpath=..')
      const siblingDiv = await parentElement?.$('xpath=following-sibling::div')
      if (siblingDiv) {
        await siblingDiv.click()
      }

      await page.waitForSelector('#barcelona-header', { timeout: 30000 })
      this.logging(jobId, '로그인 성공. 메인 페이지로 이동했습니다.')

      await page.goto('https://www.threads.com/search')
      await page.waitForTimeout(3000)
      this.logging(jobId, '검색 결과 페이지로 이동')

      const searchInputSelector = 'input[type="search"]'
      await page.waitForSelector(searchInputSelector, { timeout: 30000 })
      await page.fill(searchInputSelector, keyword)
      await page.keyboard.press('Enter')

      const articleSelector = 'div[data-interactive-id]'
      await page.waitForSelector(articleSelector, { timeout: 30000 })
      const articles = await page.$$(articleSelector)
      for (const article of articles) {
        this.logging(jobId, '게시물을 처리합니다.')
        const desc = await article.$('div > div:nth-child(3) > div > div:nth-child(1)')
        const descText = await desc?.textContent()
        const articleText = `[${descText?.slice(0, 20)}...]`
        if (followAction) {
          await this.followArticle(page, jobId, articleText, article as unknown as ElementHandle<HTMLDivElement>)
          await page.waitForTimeout(this.getRandomDelay(minDelay, maxDelay) * 1000)
        }
        if (likeAction) {
          await this.likeArticle(page, jobId, articleText, article as unknown as ElementHandle<HTMLDivElement>)
          await page.waitForTimeout(this.getRandomDelay(minDelay, maxDelay) * 1000)
        }
        if (repostAction) {
          await this.repostArticle(page, jobId, articleText, article as unknown as ElementHandle<HTMLDivElement>)
          await page.waitForTimeout(this.getRandomDelay(minDelay, maxDelay) * 1000)
        }
        if (commentAction) {
          await this.commentArticle(
            page,
            jobId,
            articleText,
            article as unknown as ElementHandle<HTMLDivElement>,
            followMessage,
          )
          await page.waitForTimeout(this.getRandomDelay(minDelay, maxDelay) * 1000)
        }
      }

      await page.waitForTimeout(this.getRandomDelay(minDelay, maxDelay) * 100000)

      this.logging(jobId, '자동화 작업이 성공적으로 완료되었습니다.')
      await browser.close()
    } catch (error: any) {
      console.error(error)
      this.logging(jobId, '자동화 작업 중 오류가 발생했습니다.')
      await browser.close()
    }
  }

  private async followArticle(page: Page, jobId: string, articleText: string, article: ElementHandle<HTMLDivElement>) {
    const button = await article.$('svg[aria-label="팔로우"]')
    if (!button) {
      this.logging(jobId, `${articleText} 이미 팔로우 된 사용자`)
      return
    } else {
      await button.click()
      await page.waitForTimeout(3000)
      const followButton = await page.$('div.__fb-light-mode div[role="button"]')
      if (followButton) {
        await followButton.click()
      }
      await page.keyboard.press('Escape')
      this.logging(jobId, `${articleText} 팔로우 완료`)
    }
  }

  private async likeArticle(page: Page, jobId: string, articleText: string, article: ElementHandle<HTMLDivElement>) {
    const likeButton = await article.$('svg[aria-label="좋아요"]')
    if (!likeButton) {
      this.logging(jobId, `${articleText} 이미 좋아요 완료`)
      return
    } else {
      await likeButton.click()
      this.logging(jobId, `${articleText} 좋아요 완료`)
    }
  }

  private async repostArticle(page: Page, jobId: string, articleText: string, article: ElementHandle<HTMLDivElement>) {
    const repostButton = await article.$('svg[aria-label="리포스트"]')
    if (!repostButton) {
      this.logging(jobId, `${articleText} 리포스트 버튼 찾을 수 없음`)
      await page.keyboard.press('Escape')
      return
    } else {
      await repostButton.click()
      await page.waitForTimeout(3000)
      const listButtons = await page.$$('div.__fb-light-mode span')
      let isProcess = false
      for (const listButton of listButtons) {
        const listButtonText = await listButton.textContent()
        if (listButtonText?.includes('리포스트')) {
          isProcess = true
          await listButton.click()
          await page.waitForTimeout(3000)
          this.logging(jobId, `${articleText} 리포스트 완료`)
          break
        }
      }
      if (!isProcess) {
        this.logging(jobId, `${articleText} 이미 리포스트 완료`)
        await page.keyboard.press('Escape')
      }
    }
  }

  private async commentArticle(
    page: Page,
    jobId: string,
    articleText: string,
    article: ElementHandle<HTMLDivElement>,
    followMessage: string,
  ) {
    const commentButton = await article.$('svg[aria-label="답글"]')
    if (!commentButton) {
      this.logging(jobId, `${articleText} 답글 버튼 찾을 수 없음`)
      return
    } else {
      await commentButton.click()
      await page.waitForTimeout(3000)
      await page.keyboard.insertText(followMessage)
      const buttons = await page.$$('div.__fb-light-mode div[role="button"]')
      for (const button of buttons) {
        const buttonText = await button.textContent()
        if (buttonText?.includes('게시')) {
          await button.click()
          break
        }
      }
      this.logging(jobId, `${articleText} 답글 완료`)
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

  private getChromiumExecutablePath() {
    const platform = os.platform()
    if (platform === 'darwin') {
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    } else if (platform === 'win32') {
      return 'C:\\Program Files (x86)\\Chromium\\Application\\chrome.exe'
    } else if (platform === 'linux') {
      return '/usr/bin/chromium-browser'
    } else {
      throw new Error('Unsupported OS')
    }
  }
}
