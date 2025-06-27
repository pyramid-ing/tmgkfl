import { ElectronModule } from '@doubleshot/nest-electron'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER, HttpAdapterHost } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { GlobalExceptionFilter } from '../filters/global-exception.filter'
import customConfig from './config/custom-config'
import { CommonModule } from './modules/common/common.module'
import { PrismaService } from './modules/common/prisma/prisma.service'
import { LogsModule } from './modules/logs/logs.module'
import { PostJobsModule } from './modules/post-jobs/post-jobs.module'
import { SettingsModule } from './modules/settings/settings.module'
import { ThreadsModule } from './modules/threads/threads.module'
import { UtilModule } from './modules/util/util.module'

@Module({
  imports: [
    ElectronModule.registerAsync({
      useFactory: async () => {
        const isDev = !app.isPackaged
        const win = new BrowserWindow({
          width: 1024,
          height: 768,
          autoHideMenuBar: true,
          webPreferences: {
            contextIsolation: true,
            preload: join(__dirname, '../preload/index.cjs'),
          },
        })

        win.on('closed', () => {
          win.destroy()
        })

        const URL = isDev ? process.env.DS_RENDERER_URL : `file://${join(app.getAppPath(), 'dist/render/index.html')}`

        win.loadURL(URL)

        return { win }
      },
    }),
    ConfigModule.forRoot({
      load: [customConfig],
      isGlobal: true,
    }),
    SettingsModule,
    ScheduleModule.forRoot(),
    CommonModule,
    UtilModule,
    ThreadsModule,
    LogsModule,
    PostJobsModule,
  ],
  providers: [
    {
      // 의존성 주입이 가능하도록 module에도 설정해준다.
      provide: APP_FILTER,
      useFactory: (httpAdapter: HttpAdapterHost) => {
        return new GlobalExceptionFilter(httpAdapter)
      },
      inject: [HttpAdapterHost],
    },
    PrismaService,
  ],
  controllers: [],
})
export class AppModule {}
