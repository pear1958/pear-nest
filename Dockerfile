# 使用官方的 Node.js 20 轻量级版本作为基础镜像，并将此阶段命名为 base
# 轻量级版本镜像体积更小，适合生产环境使用
FROM node:20-slim AS base

# 定义一个构建参数 PROJECT_DIR，可在构建镜像时通过 --build-arg 指定该参数的值
ARG PROJECT_DIR

# 设置环境变量
# DB_HOST 为数据库主机名，这里默认设置为 mysql
# APP_PORT 为应用程序监听的端口，默认设置为 7001
# PNPM_HOME 为 pnpm 的安装目录
# PATH 环境变量中添加 pnpm 目录，以便可以直接使用 pnpm 命令
ENV DB_HOST=mysql \
    APP_PORT=7001 \
    PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:$PATH"

# 在容器内执行命令
# corepack enable 启用 Node.js 的包管理器包装器，可管理不同的包管理器
# yarn global add pm2 全局安装 pm2 进程管理器，用于管理 Node.js 应用程序的进程
RUN corepack enable \
    && yarn global add pm2

# 设置工作目录为 PROJECT_DIR 指定的目录
# 后续的 COPY、RUN 等命令将在该目录下执行
# 构建 Docker 镜像时能够动态指定 
# eg: docker build --build-arg PROJECT_DIR=/app -t my-nest-admin .
WORKDIR $PROJECT_DIR

# 将当前上下文（也就是 nest-admin 目录）下的所有文件复制到容器内的 PROJECT_DIR 目录
COPY ./ $PROJECT_DIR

# 为 wait-for-it.sh 脚本添加可执行权限
# wait-for-it.sh 脚本通常用于等待某个服务（如数据库）就绪后再执行后续操作
# 文件所有者拥有读取、写入和执行权限
# 所属组和其他用户拥有读取和执行权限
RUN chmod +x ./wait-for-it.sh 

# 设置容器的时区为亚洲/上海
# ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime 建立软链接，将系统时区指向上海
# echo 'Asia/Shanghai' > /etc/timezone 将时区信息写入 /etc/timezone 文件
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo 'Asia/Shanghai' > /etc/timezone

# 基于 base 阶段创建一个新的构建阶段，命名为 prod-deps
# 此阶段用于安装生产环境所需的依赖
FROM base AS prod-deps
# 使用 Docker BuildKit 的挂载缓存功能，将 pnpm 的缓存目录挂载到容器内的 /pnpm/store
# pnpm install --prod --frozen-lockfile 安装生产环境依赖，并使用 pnpm-lock.yaml 文件锁定依赖版本
# 此阶段仅安装生产环境所需的依赖（通过 --prod 参数实现），目的是生成体积最小的生产镜像
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile 

# 基于 base 阶段创建一个新的构建阶段，命名为 build
# 此阶段用于安装所有依赖并构建项目
FROM base AS build
# 同样使用 Docker BuildKit 的挂载缓存功能，安装所有依赖（包括开发依赖）并使用 pnpm-lock.yaml 文件锁定依赖版本
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# 执行 pnpm run build 命令来构建项目，通常会将 TypeScript 代码编译成 JavaScript 代码
RUN pnpm run build

# 回到 base 阶段，作为最终的镜像构建阶段
FROM base

# 从 prod-deps 阶段复制生产环境所需的 node_modules 目录到最终镜像的 PROJECT_DIR 目录下
COPY --from=prod-deps $PROJECT_DIR/node_modules $PROJECT_DIR/node_modules

# 从 build 阶段复制编译后的 dist 目录到最终镜像的 PROJECT_DIR 目录下
COPY --from=build $PROJECT_DIR/dist $PROJECT_DIR/dist

# 声明容器将监听的端口，使用 APP_PORT 环境变量指定的端口
# 注意：这只是声明，实际的端口映射需要在运行容器时通过 -p 参数指定
EXPOSE $APP_PORT

# 定义容器启动时的入口点命令
# ./wait-for-it.sh $DB_HOST:$DB_PORT -- 等待数据库服务就绪
# pnpm migration:run 执行数据库迁移脚本，更新数据库结构
# pm2-runtime ecosystem.config.js 使用 pm2 进程管理器以运行时模式启动项目，ecosystem.config.js 是 pm2 的配置文件
ENTRYPOINT ./wait-for-it.sh $DB_HOST:$DB_PORT -- pnpm migration:run && pm2-runtime ecosystem.config.js
