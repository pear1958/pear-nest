import { MenuEntity } from '@/modules/system/menu/menu.entity'
import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator'

export class AccountUpdateDto {
  @ApiProperty({ description: '用户呢称' })
  @IsString()
  @IsOptional()
  nickname: string

  @ApiProperty({ description: '用户邮箱' })
  @IsOptional()
  @IsEmail()
  email: string

  @ApiProperty({ description: '用户QQ' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/)
  @MinLength(5)
  @MaxLength(11)
  qq: string

  @ApiProperty({ description: '用户手机号' })
  @IsOptional()
  @IsString()
  phone: string

  @ApiProperty({ description: '用户头像' })
  @IsOptional()
  @IsString()
  avatar: string

  @ApiProperty({ description: '用户备注' })
  @IsOptional()
  @IsString()
  remark: string
}

export class MenuMeta extends PartialType(
  OmitType(MenuEntity, [
    'parentId',
    'createdAt',
    'updatedAt',
    'id',
    'roles',
    'path',
    'name'
  ] as const)
) {
  title: string
}

export class AccountMenus extends PickType(MenuEntity, [
  'id',
  'path',
  'name',
  'component'
] as const) {
  meta: MenuMeta
}
