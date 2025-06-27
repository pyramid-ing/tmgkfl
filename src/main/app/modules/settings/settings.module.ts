import { Module } from '@nestjs/common'
import { SettingsService } from 'src/main/app/modules/settings/settings.service'
import { SettingsController } from './settings.controller'

@Module({
  providers: [SettingsService],
  controllers: [SettingsController],
  exports: [SettingsService],
})
export class SettingsModule {}
