import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'
import { UploadModule } from './upload/upload.module'

const modules = [UploadModule]

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
