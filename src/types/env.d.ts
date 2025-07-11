// generate by ./scripts/generateEnvTypes.ts
// 使用方法: process.env.xxx
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_NAME: 'Pear-Admin'
      APP_PORT: '3000'
      APP_BASE_URL: 'http://localhost:${APP_PORT}'
      APP_PREFIX: 'api'
      LOGGER_LEVEL: 'verbose'
      LOGGER_MAX_FILES: '31'
      MULTI_DEVICE_LOGIN: 'true'
      OSS_ACCESSKEY: 'xxx'
      OSS_SECRETKEY: 'xxx'
      OSS_DOMAIN: 'https://cdn.buqiyuan.site'
      OSS_BUCKET: 'nest-admin'
      OSS_ZONE: 'Zone_z2'
      OSS_ACCESS_TYPE: 'public'
      SWAGGER_ENABLE: 'true'
      SWAGGER_PATH: 'api-docs'
      SWAGGER_VERSION: '1.0'
      DB_HOST: '127.0.0.1'
      DB_PORT: '3306'
      DB_DATABASE: 'pear_nest'
      DB_USERNAME: 'root'
      DB_PASSWORD: '123456'
      DB_LOGGING: '["error"]'
      REDIS_HOST: '127.0.0.1'
      REDIS_PORT: '6379'
      REDIS_PASSWORD: '123456'
      REDIS_DB: '0'
      JWT_SECRET: 'admin!@'
      JWT_EXPIRE: '86400'
      REFRESH_TOKEN_SECRET: 'admin!@'
      REFRESH_TOKEN_EXPIRE: '2592000'
      SMTP_HOST: 'smtp.163.com'
      SMTP_PORT: '465'
      SMTP_USER: 'nest_admin@163.com'
      SMTP_PASS: 'VIPLLOIPMETTROYU'
    }
  }
}

export {}
