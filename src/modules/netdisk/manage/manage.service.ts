import { Inject, Injectable } from '@nestjs/common'
import * as qiniu from 'qiniu'
import { auth, conf, rs } from 'qiniu'
import { OssConfig, ossConfig } from '@/config/oss.config'
import { UserService } from '@/modules/system/user/user.service'
import { SFileInfo, SFileList } from './manage.model'
import { isEmpty } from 'lodash'
import { NETDISK_DELIMITER, NETDISK_LIMIT } from '@/constant/oss.constant'
import { generateRandomValue } from '@/utils/index.util'

@Injectable()
export class ManageService {
  private config: conf.Config
  private mac: auth.digest.Mac
  private bucketManager: rs.BucketManager

  constructor(
    @Inject(ossConfig.KEY) private qiniuConfig: OssConfig,
    private userService: UserService
  ) {
    this.mac = new qiniu.auth.digest.Mac(this.qiniuConfig.accessKey, this.qiniuConfig.secretKey)
    this.config = new qiniu.conf.Config({
      zone: this.qiniuConfig.zone
    })
    // bucket manager
    this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config)
  }

  /**
   * 获取文件列表
   * @param prefix 当前文件夹路径，搜索模式下会被忽略
   * @param marker 下一页标识
   * @returns iFileListResult
   */
  async getFileList(prefix = '', marker = '', skey = ''): Promise<SFileList> {
    // 是否需要搜索
    const searching = !isEmpty(skey)

    return new Promise<SFileList>((resolve, reject) => {
      this.bucketManager.listPrefix(
        this.qiniuConfig.bucket,
        {
          prefix: searching ? '' : prefix,
          limit: NETDISK_LIMIT,
          delimiter: searching ? '' : NETDISK_DELIMITER,
          marker
        },
        (err, respBody, respInfo) => {
          if (err) {
            reject(err)
            return
          }

          if (respInfo.statusCode === 200) {
            // 如果这个nextMarker不为空，那么还有未列举完毕的文件列表，下次调用listPrefix的时候，
            // 指定options里面的marker为这个值
            const fileList: SFileInfo[] = []

            // 处理目录，但只有非搜索模式下可用
            if (!searching && !isEmpty(respBody.commonPrefixes)) {
              // dir
              for (const dirPath of respBody.commonPrefixes) {
                const name = (dirPath as string).substr(0, dirPath.length - 1).replace(prefix, '')
                if (isEmpty(skey) || name.includes(skey)) {
                  fileList.push({
                    name: (dirPath as string).substr(0, dirPath.length - 1).replace(prefix, ''),
                    type: 'dir',
                    id: generateRandomValue(10)
                  })
                }
              }
            }

            // handle items
            if (!isEmpty(respBody.items)) {
              // file
              for (const item of respBody.items) {
                // 搜索模式下处理
                if (searching) {
                  const pathList: string[] = item.key.split(NETDISK_DELIMITER)
                  // dir is empty stirng, file is key string
                  const name = pathList.pop()
                  if (
                    item.key.endsWith(NETDISK_DELIMITER) &&
                    pathList[pathList.length - 1].includes(skey)
                  ) {
                    // 结果是目录
                    const ditName = pathList.pop()
                    fileList.push({
                      id: generateRandomValue(10),
                      name: ditName,
                      type: 'dir',
                      belongTo: pathList.join(NETDISK_DELIMITER)
                    })
                  } else if (name.includes(skey)) {
                    // 文件
                    fileList.push({
                      id: generateRandomValue(10),
                      name,
                      type: 'file',
                      fsize: item.fsize,
                      mimeType: item.mimeType,
                      putTime: new Date(Number.parseInt(item.putTime) / 10000),
                      belongTo: pathList.join(NETDISK_DELIMITER)
                    })
                  }
                } else {
                  // 正常获取列表
                  const fileKey = item.key.replace(prefix, '') as string
                  if (!isEmpty(fileKey)) {
                    fileList.push({
                      id: generateRandomValue(10),
                      name: fileKey,
                      type: 'file',
                      fsize: item.fsize,
                      mimeType: item.mimeType,
                      putTime: new Date(Number.parseInt(item.putTime) / 10000)
                    })
                  }
                }
              }
            }

            resolve({
              list: fileList,
              marker: respBody.marker || null
            })
          } else {
            reject(
              new Error(`Qiniu Error Code: ${respInfo.statusCode}, Info: ${respInfo.statusMessage}`)
            )
          }
        }
      )
    })
  }
}
