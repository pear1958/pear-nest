### 开发时使用的node版本

- v22.16.0

### Docker讲解

```
1. Dockerfile → 蛋糕食谱
2. build（构建）→ 按食谱做蛋糕
3. 镜像 → 做好的成品蛋糕
4. 容器 → 切开吃的蛋糕（运行中的蛋糕）
```

### 启动项目

- npm run start `仅启动项目`

- npm run start:dev `启动项目并热重载`

- 快速生成模块 nest g resource dir

- 启动 redis `redis-server redis.windows.conf`

### 接口文档

- 推荐使用 swagger -> apifox / knife4j

### 数据库

- `migration:create` 和 `migration:generate` 这两个命令在执行时, 会把新创建或生成的迁移文件存放到 ./src/migrations 目录下
- `migration:run` 和 `migration:revert` 这两个命令是用来执行迁移操作的, 但它们自身并未指定迁移文件的路径 (database.config.ts)

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.
