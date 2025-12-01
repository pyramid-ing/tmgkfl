import { SettingsModule } from '@main/app/modules/settings/settings.module'
import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthInitializer } from './auth.initializer'
import { AuthService } from './auth.service'

@Module({
  imports: [SettingsModule],
  controllers: [AuthController],
  providers: [AuthService, AuthInitializer],
})
export class AuthModule {}
