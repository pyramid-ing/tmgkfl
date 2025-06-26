import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { EnvConfig } from '../../config/env.config'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const config = EnvConfig.getPrismaConfig()

    super({
      log: config.isDev ? ['query', 'info', 'warn', 'error'] : ['error'],
      datasources: {
        db: {
          url: config.dbUrl,
        },
      },
    })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
