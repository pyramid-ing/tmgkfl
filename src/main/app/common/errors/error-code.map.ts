import { ErrorCode } from './error-code.enum'

export interface ErrorCodeMeta {
  status: number
  message: (metadata?: Record<string, any>) => string
}

export const ErrorCodeMap: Record<ErrorCode, ErrorCodeMeta> = {
  // 인증 관련
  [ErrorCode.AUTH_REQUIRED]: { status: 401, message: () => '로그인이 필요합니다.' },
  [ErrorCode.TOKEN_EXPIRED]: { status: 401, message: () => '토큰이 만료되었습니다.' },

  // 권한
  [ErrorCode.NO_PERMISSION]: { status: 403, message: () => '권한이 없습니다.' },

  // 요청 관련
  [ErrorCode.INVALID_REQUEST]: { status: 400, message: m => m?.message || '잘못된 요청입니다.' },

  // 라이센스 관련
  [ErrorCode.LICENSE_INVALID]: { status: 403, message: () => '유효하지 않은 라이센스입니다.' },
  [ErrorCode.LICENSE_EXPIRED]: { status: 403, message: () => '라이센스가 만료되었습니다.' },
  [ErrorCode.LICENSE_NOT_FOUND]: {
    status: 403,
    message: meta => meta?.message || '라이센스를 찾을 수 없습니다. 먼저 라이센스를 등록해주세요.',
  },
  [ErrorCode.LICENSE_CHECK_FAILED]: { status: 500, message: () => '라이센스 확인에 실패했습니다.' },
  [ErrorCode.LICENSE_PERMISSION_DENIED]: {
    status: 403,
    message: meta => `권한이 없습니다.${meta?.permissions ? ` (필요한 권한: ${meta.permissions.join(', ')})` : ''}`,
  },
  [ErrorCode.LICENSE_REGISTRATION_FAILED]: { status: 500, message: () => '라이센스 등록에 실패했습니다.' },
  [ErrorCode.LICENSE_ALREADY_REGISTERED]: { status: 409, message: () => '이미 등록된 라이센스입니다.' },
  [ErrorCode.LICENSE_KEY_INVALID]: { status: 400, message: () => '유효하지 않은 라이센스 키입니다.' },

  [ErrorCode.INTERNAL_ERROR]: { status: 500, message: () => '500 서버 내부 에러' },
}
