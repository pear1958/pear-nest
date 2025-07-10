import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'
import { UploadModule } from './upload/upload.module'
import { StorageModule } from './storage/storage.module'
import { EmailModule } from './email/email.module'

const modules = [UploadModule, StorageModule, EmailModule]

@Module({
  imports: [
    ...modules,
    RouterModule.register([
      {
        path: 'tools',
        module: ToolsModule,
        children: [...modules]
      }
    ])
  ],
  exports: [...modules]
})
export class ToolsModule {}
