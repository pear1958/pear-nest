import { forwardRef, Module } from '@nestjs/common'
import { UploadService } from './upload.service'
import { UploadController } from './upload.controller'
import { StorageModule } from '../storage/storage.module'

@Module({
  imports: [forwardRef(() => StorageModule)],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService]
})
export class UploadModule {}
