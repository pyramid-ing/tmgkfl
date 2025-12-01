import { PrismaService } from '@main/app/modules/common/prisma/prisma.service'
import { Injectable, Logger } from '@nestjs/common'
import { OpenAI } from 'openai'
import { Permission } from '../auth/auth.guard'

interface AppSettings {
  showBrowserWindow: boolean
}

// 라이선스 및 기타 글로벌 설정 구조
export interface GlobalSettings {
  licenseKey?: string
  licenseCache?: {
    isValid: boolean
    permissions: Permission[]
    expiresAt?: number
  } | null
  // 그 외 글로벌 설정도 자유롭게 포함 가능
  [key: string]: any
}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name)

  constructor(private readonly prisma: PrismaService) {}

  // 앱 설정 조회
  async getAppSettings(): Promise<AppSettings> {
    const settings = await this.findByKey('app')
    return (
      (settings?.data as unknown as AppSettings) || {
        showBrowserWindow: true,
      }
    )
  }

  // 글로벌 설정 조회 (라이선스 포함)
  async getSettings(): Promise<GlobalSettings> {
    const settings = await this.findByKey('global')
    return (settings?.data as GlobalSettings) || {}
  }

  // 글로벌 설정 부분 업데이트 (merge)
  async updateSettings(partial: Partial<GlobalSettings>): Promise<GlobalSettings> {
    const current = await this.getSettings()
    const next: GlobalSettings = {
      ...current,
      ...partial,
    }
    await this.saveByKey('global', next)
    return next
  }

  // 모든 설정 조회
  async findAll() {
    return this.prisma.settings.findMany()
  }

  // key로 조회
  async findByKey(key: string) {
    return this.prisma.settings.findFirst({ where: { id: this.keyToId(key) } })
  }

  // key로 저장 (upsert)
  async saveByKey(key: string, data: any) {
    return this.prisma.settings.upsert({
      where: { id: this.keyToId(key) },
      update: { data },
      create: { id: this.keyToId(key), data },
    })
  }

  // upsert 메서드 (컨트롤러에서 사용)
  async upsert(key: string, data: any) {
    return this.saveByKey(key, data)
  }

  // OpenAI API 키 검증
  async validateOpenAIKey(apiKey: string): Promise<{ valid: boolean; error?: string; model?: string }> {
    try {
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
        return { valid: false, error: 'API 키가 비어있습니다.' }
      }

      const openai = new OpenAI({ apiKey: apiKey.trim() })

      // 간단한 모델 목록 조회로 API 키 유효성 검증
      const models = await openai.models.list()

      // GPT 모델이 있는지 확인
      const gptModels = models.data.filter(model => model.id.includes('gpt') || model.id.includes('o1'))

      if (gptModels.length === 0) {
        return { valid: false, error: 'GPT 모델에 접근할 수 없습니다.' }
      }

      // 사용 가능한 첫 번째 GPT 모델 반환
      const availableModel =
        gptModels.find(m => m.id.includes('gpt-4') || m.id.includes('gpt-3.5') || m.id.includes('o1'))?.id ||
        gptModels[0].id

      return {
        valid: true,
        model: availableModel,
      }
    } catch (error) {
      this.logger.error('OpenAI API 키 검증 실패:', error)

      if ((error as any).status === 401) {
        return { valid: false, error: '유효하지 않은 API 키입니다.' }
      } else if ((error as any).status === 429) {
        return { valid: false, error: 'API 사용량 한도를 초과했습니다.' }
      } else if ((error as any).status === 403) {
        return { valid: false, error: 'API 키에 필요한 권한이 없습니다.' }
      } else {
        return { valid: false, error: `API 키 검증 실패: ${(error as any).message}` }
      }
    }
  }

  // key를 id로 변환 (간단 매핑, 실제 운영시 key 컬럼 추가 권장)
  private keyToId(key: string): number {
    if (key === 'global') return 2
    if (key === 'app') return 1
    return 9999 // 기타
  }
}
