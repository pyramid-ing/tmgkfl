import { CanActivate, ExecutionContext, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import axios from 'axios'
import { machineId } from 'node-machine-id'

export const PERMISSIONS_KEY = 'permissions'

export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions)

export interface LicenseRes {
  license: {
    permissions: string[]
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest()
    const keymasterEndpoint = this.configService.get('keymaster.endpoint')
    const keymasterService = this.configService.get('keymaster.service')

    const requiredPermissions = this.reflector.get<string[]>(PERMISSIONS_KEY, context.getHandler()) ?? []

    const key = await machineId()
    try {
      const { data } = await axios.get<LicenseRes>(`${keymasterEndpoint}/auth/${keymasterService}/check-license`, {
        params: { key },
      })
      const isValid = requiredPermissions.every(permission => data.license.permissions.includes(permission))
      if (isValid) {
        return true
      } else {
        throw new UnauthorizedException('권한이 없습니다. 관리자에게 문의해주세요.')
      }
    } catch (err) {
      throw new UnauthorizedException('권한이 없습니다. 관리자에게 문의해주세요.')
    }
  }
}
