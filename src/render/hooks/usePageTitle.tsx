import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { FULL_PAGE_TITLES, createPageTitle } from '../utils/title'

// 페이지 제목 타입
type PageTitleKey = keyof typeof FULL_PAGE_TITLES

// 커스텀 훅: 제목만 변경 (Helmet 컴포넌트 없이)
export const useSetPageTitle = (titleKey: PageTitleKey) => {
  useEffect(() => {
    document.title = FULL_PAGE_TITLES[titleKey]
  }, [titleKey])
}

// 커스텀 훅: 동적 제목만 변경 (Helmet 컴포넌트 없이)
export const useSetDynamicPageTitle = (pageTitle: string) => {
  useEffect(() => {
    document.title = createPageTitle(pageTitle)
  }, [pageTitle])
}

// 컴포넌트: 페이지 제목 설정
export const PageTitle = ({ titleKey }: { titleKey: PageTitleKey }) => {
  return (
    <Helmet>
      <title>{FULL_PAGE_TITLES[titleKey]}</title>
    </Helmet>
  )
}

// 컴포넌트: 동적 제목 설정
export const DynamicPageTitle = ({ title }: { title: string }) => {
  return (
    <Helmet>
      <title>{createPageTitle(title)}</title>
    </Helmet>
  )
}
