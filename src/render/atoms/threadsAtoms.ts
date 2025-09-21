import { atom } from 'recoil'

// 로그 타입 정의
export interface LogEntry {
  id?: string
  createdAt: string
  message: string
}

// 스하리 로그 목록 상태
export const threadsLogsState = atom<LogEntry[]>({
  key: 'threadsLogsState',
  default: [],
})

// 현재 작업 ID 상태
export const threadsJobIdState = atom<string | null>({
  key: 'threadsJobIdState',
  default: null,
})

// 로그 로딩 상태
export const threadsLogsLoadingState = atom<boolean>({
  key: 'threadsLogsLoadingState',
  default: false,
})
