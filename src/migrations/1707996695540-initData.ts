import fs from 'node:fs'
import path from 'node:path'
import { MigrationInterface, QueryRunner } from 'typeorm'

const sql = fs.readFileSync(path.join(__dirname, '../../deploy/sql/nest_admin.sql'), 'utf8')

export class InitData1707996695540 implements MigrationInterface {
  // 为迁移操作提供一个唯一的名称
  name = 'InitData1707996695540' // InitData<timestamp>

  // 初始化数据库
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 这里需要手动编写迁移操作的 SQL 语句或代码逻辑
    await queryRunner.query(sql)
  }

  // 为空，这表明该迁移操作是不可逆的，无法回滚
  public async down(queryRunner: QueryRunner): Promise<void> {}
}
