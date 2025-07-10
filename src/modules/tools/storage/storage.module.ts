import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StorageService } from './storage.service'
import { StorageController } from './storage.controller'
import { StorageEntity } from './storage.entity'
import { UserEntity } from '@/modules/system/user/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([StorageEntity, UserEntity])],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [TypeOrmModule, StorageService]
})
export class StorageModule {}
