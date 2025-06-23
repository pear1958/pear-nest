import { CommonEntity } from "@/common/entity/common.entity";
import { Entity } from "typeorm";

@Entity({ name: 'sys_user' })
export class UserEntity extends CommonEntity {
}
