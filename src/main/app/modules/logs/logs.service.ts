import { Injectable } from '@nestjs/common'
import { PrismaService } from '../common/prisma/prisma.service'

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLogs(jobId: string) {
    return await this.prisma.log.findMany({ where: { jobId }, orderBy: { createdAt: 'desc' } })
  }
}
