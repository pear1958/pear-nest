import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'
import { UploadModule } from './upload/upload.module'
import { StorageModule } from './storage/storage.module'

const modules = [UploadModule, StorageModule]

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
