// 기본 앱 제목
export const APP_TITLE = '윈소프트 Threads 자동화 봇'

// 페이지별 제목
export const PAGE_TITLES = {
  HOME: '홈',
  THREADS: '자동 스하리',
  POST_JOB: '자동 포스팅',
  SETTINGS: '설정',
} as const

// 전체 제목 생성 함수
export const createPageTitle = (pageTitle: string): string => {
  return `${pageTitle} - ${APP_TITLE}`
}

// 페이지별 전체 제목
export const FULL_PAGE_TITLES = {
  HOME: createPageTitle(PAGE_TITLES.HOME),
  THREADS: createPageTitle(PAGE_TITLES.THREADS),
  POST_JOB: createPageTitle(PAGE_TITLES.POST_JOB),
  SETTINGS: createPageTitle(PAGE_TITLES.SETTINGS),
} as const
