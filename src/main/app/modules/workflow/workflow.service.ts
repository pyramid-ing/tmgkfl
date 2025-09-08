import { Injectable } from '@nestjs/common'
import { chromium, ElementHandle, Page } from 'playwright'

export interface LoginParams {
  id: string
  pw: string
}

@Injectable()
export class WorkflowService {
  // 패널이 나타났는지 확인하고 백드롭을 클릭해서 닫는 유틸리티 함수
  private async closeModalIfPresent(page: Page) {
    try {
      // 여러 가능한 패널 선택자들
      const panelSelectors = ['div[role="dialog"]']

      // 백드롭 선택자들
      const backdropSelectors = [
        'div.x1ey2m1c.xtijo5x.x1o0tod.xixxii4.x13vifvy.x5hsz1j.x1u6grsq.xqcmdr3.x4hg4is.xwv1ft4',
      ]

      // 패널이 있는지 확인
      let panelFound = false
      for (const selector of panelSelectors) {
        const panel = await page.$(selector)
        if (panel) {
          panelFound = true
          break
        }
      }

      if (panelFound) {
        // 백드롭을 찾아서 클릭
        for (const selector of backdropSelectors) {
          const backdrop = await page.$(selector)
          if (backdrop) {
            // ESC 키로도 닫기 시도
            await page.keyboard.press('Escape')
            // await backdrop.click()
            await page.waitForTimeout(1000)
            break
          }
        }
      }
    } catch (error) {
      // 에러가 발생해도 계속 진행
      console.log('패널 닫기 중 에러 발생:', error.message)
    }
  }
  async launch(headless: boolean) {
    const browser = await chromium.launch({
      headless,
      executablePath: process.env.PLAYWRIGHT_BROWSERS_PATH,
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

    return { browser, context }
  }

  async login(page: Page, params: LoginParams) {
    const { id, pw } = params
    await page.goto('https://www.threads.com/login/')
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
  }

  async gotoSearch(page: Page) {
    await page.goto('https://www.threads.com/search')
    await page.waitForTimeout(3000)
  }

  async search(page: Page, keyword: string) {
    const searchInputSelector = 'input[type="search"]'
    await page.waitForSelector(searchInputSelector, { timeout: 30000 })
    await page.fill(searchInputSelector, keyword)
    await page.keyboard.press('Enter')
  }

  async waitArticles(page: Page, articleSelector: string) {
    await page.waitForSelector(articleSelector, { timeout: 30000 })
  }

  async isAlreadyFollowed(article: ElementHandle<HTMLDivElement>): Promise<boolean> {
    const button = await article.$('svg[aria-label="팔로우"]')
    return !button // 팔로우 버튼이 없으면 이미 팔로우된 상태
  }

  async followArticle(page: Page, article: ElementHandle<HTMLDivElement>) {
    // 패널이 나타나면 닫기
    await this.closeModalIfPresent(page)

    const button = await article.$('svg[aria-label="팔로우"]')
    if (!button) {
      throw new Error('이미 팔로우 된 사용자')
    } else {
      await button.click()
      await page.waitForTimeout(3000)

      const followButton = await page.$('div.__fb-light-mode div[role="button"]')
      if (followButton) {
        await followButton.click()
      }
      await page.keyboard.press('Escape')
    }
  }

  async isAlreadyLiked(article: ElementHandle<HTMLDivElement>): Promise<boolean> {
    const likeButton = await article.$('svg[aria-label="좋아요"]')
    return !likeButton // 좋아요 버튼이 없으면 이미 좋아요된 상태
  }

  async likeArticle(page: Page, article: ElementHandle<HTMLDivElement>) {
    // 패널이 나타나면 닫기
    await this.closeModalIfPresent(page)

    const likeButton = await article.$('svg[aria-label="좋아요"]')
    if (!likeButton) {
      throw new Error('이미 좋아요 완료')
    } else {
      await likeButton.click()
      await page.waitForTimeout(1000)
    }
  }

  async isAlreadyReposted(page: Page, article: ElementHandle<HTMLDivElement>): Promise<boolean> {
    const repostButton = await article.$('svg[aria-label="리포스트"]')
    if (!repostButton) {
      return true // 리포스트 버튼이 없으면 이미 리포스트된 상태
    }

    // 리포스트 버튼을 클릭해서 패널을 열어보고 확인
    await repostButton.click()
    await page.waitForTimeout(3000)

    const listButtons = await page.$$('div.__fb-light-mode span')
    let isAlreadyReposted = true

    for (const listButton of listButtons) {
      const listButtonText = await listButton.textContent()
      if (listButtonText?.includes('리포스트')) {
        isAlreadyReposted = false
        break
      }
    }

    // 패널 닫기
    await this.closeModalIfPresent(page)
    return isAlreadyReposted
  }

  async repostArticle(page: Page, article: ElementHandle<HTMLDivElement>) {
    // 패널이 나타나면 닫기
    await this.closeModalIfPresent(page)

    const repostButton = await article.$('svg[aria-label="리포스트"]')
    if (!repostButton) {
      throw new Error('리포스트 버튼 찾을 수 없음')
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
          break
        }
      }
      if (!isProcess) {
        // 이미 리포스트 완료인 경우에도 패널을 닫고 에러 던지기
        await this.closeModalIfPresent(page)
        throw new Error('이미 리포스트 완료')
      }
    }
  }

  async commentArticle(page: Page, article: ElementHandle<HTMLDivElement>, followMessage: string) {
    // 패널이 나타나면 닫기
    await this.closeModalIfPresent(page)

    const commentButton = await article.$('svg[aria-label="답글"]')
    if (!commentButton) {
      throw new Error('댓글 버튼 찾을 수 없음')
    } else {
      await commentButton.click()
      await page.waitForTimeout(3000)

      await page.keyboard.insertText(followMessage)
      await page.waitForTimeout(1000)
      const buttons = await page.$$('div.__fb-light-mode div[role="button"]')
      let isProcess = false
      // 팝업패턴
      if (buttons.length > 0) {
        for (const button of buttons) {
          const buttonText = await button.textContent()
          if (buttonText?.includes('게시')) {
            isProcess = true
            await button.click()
            break
          }
        }
      } else {
        const button = await article.$('svg[aria-label="답글"][viewBox="0 0 24 24"]')
        if (button) {
          isProcess = true
          await button.click()
        }
      }
      if (!isProcess) {
        throw new Error('댓글 전송버튼 찾을 수 없음')
      }
    }
  }

  async postArticle(page: Page, subject: string, content: string) {
    await page.mouse.click(page.viewportSize()!.width / 2, page.viewportSize()!.height - 50)
    await page.waitForTimeout(3000)
    await page.keyboard.insertText(content)
    await page.waitForTimeout(3000)
    // const subjectInput = await page.$('input')
    // if (subjectInput) {
    //   await subjectInput.fill(subject)
    // } else {
    //   throw new Error('게시글 제목 입력 필드 찾을 수 없음')
    // }
    const postButton = page.getByRole('button').filter({ hasText: '게시' })
    const isProcess = (await postButton.count()) > 0
    if (isProcess) {
      await postButton.click()
    } else {
      throw new Error('게시글 게시 버튼 찾을 수 없음')
    }
    await page.waitForTimeout(5000)
  }
}
