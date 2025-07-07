import { MigrationInterface, QueryRunner } from 'typeorm'

// migration:generate 命令用于根据实体类（Entity）的变化自动生成迁移文件。
// 它会对比当前数据库的结构和实体类的定义，找出差异并生成相应的 SQL 语句，然后将这些语句写入迁移文件

export class UpdateTable2001717007831711 implements MigrationInterface {
  name = 'UpdateTable2001717007831711'

  // 以下几个表需要添加 create_by update_by 字段
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 向 sys_dept 表中添加一个名为 create_by 的整数类型列，允许为空，用于记录创建者信息
    await queryRunner.query(`ALTER TABLE \`sys_dept\` ADD \`create_by\` int NULL COMMENT '创建者'`)
    await queryRunner.query(`ALTER TABLE \`sys_dept\` ADD \`update_by\` int NULL COMMENT '更新者'`)
    await queryRunner.query(`ALTER TABLE \`sys_menu\` ADD \`create_by\` int NULL COMMENT '创建者'`)
    await queryRunner.query(`ALTER TABLE \`sys_menu\` ADD \`update_by\` int NULL COMMENT '更新者'`)
    await queryRunner.query(`ALTER TABLE \`sys_role\` ADD \`create_by\` int NULL COMMENT '创建者'`)
    await queryRunner.query(`ALTER TABLE \`sys_role\` ADD \`update_by\` int NULL COMMENT '更新者'`)
    // 修改 sys_role 表中的 value 列，将其类型设置为 varchar(255) 且不为空，并添加注释说明该列是角色标识
    await queryRunner.query(
      `ALTER TABLE \`sys_role\` CHANGE \`value\` \`value\` varchar(255) NOT NULL COMMENT '角色标识'`
    )
    // 修改 sys_dict_type 表中的 create_by 列，将其设置为允许为空，并添加注释说明该列是创建者信息
    await queryRunner.query(
      `ALTER TABLE \`sys_dict_type\` CHANGE \`create_by\` \`create_by\` int NULL COMMENT '创建者'`
    )
    await queryRunner.query(
      `ALTER TABLE \`sys_dict_type\` CHANGE \`update_by\` \`update_by\` int NULL COMMENT '更新者'`
    )
    await queryRunner.query(
      `ALTER TABLE \`sys_dict_item\` CHANGE \`create_by\` \`create_by\` int NULL COMMENT '创建者'`
    )
    await queryRunner.query(
      `ALTER TABLE \`sys_dict_item\` CHANGE \`update_by\` \`update_by\` int NULL COMMENT '更新者'`
    )
  }

  // 执行相反的 ALTER TABLE 语句，将表结构恢复到迁移前的状态
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`sys_dict_type\` CHANGE \`update_by\` \`update_by\` int NOT NULL COMMENT '更新者'`
    )
    await queryRunner.query(
      `ALTER TABLE \`sys_dict_type\` CHANGE \`create_by\` \`create_by\` int NOT NULL COMMENT '创建者'`
    )
    await queryRunner.query(
      `ALTER TABLE \`sys_dict_item\` CHANGE \`update_by\` \`update_by\` int NOT NULL COMMENT '更新者'`
    )
    await queryRunner.query(
      `ALTER TABLE \`sys_dict_item\` CHANGE \`create_by\` \`create_by\` int NOT NULL COMMENT '创建者'`
    )
    await queryRunner.query(
      `ALTER TABLE \`sys_role\` CHANGE \`value\` \`value\` varchar(255) NOT NULL`
    )
    await queryRunner.query(`ALTER TABLE \`sys_role\` DROP COLUMN \`update_by\``)
    await queryRunner.query(`ALTER TABLE \`sys_role\` DROP COLUMN \`create_by\``)
    await queryRunner.query(`ALTER TABLE \`sys_menu\` DROP COLUMN \`update_by\``)
    await queryRunner.query(`ALTER TABLE \`sys_menu\` DROP COLUMN \`create_by\``)
    await queryRunner.query(`ALTER TABLE \`sys_dept\` DROP COLUMN \`update_by\``)
    await queryRunner.query(`ALTER TABLE \`sys_dept\` DROP COLUMN \`create_by\``)
  }
}
