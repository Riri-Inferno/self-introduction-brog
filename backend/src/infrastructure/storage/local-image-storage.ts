import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { ImageStorage } from '../../application/ports/image-storage.js'

/**
 * ローカル開発用。画像を dir 以下のファイルに置く(ADR 0011)。
 * contentType はファイルの拡張子で表すので、保存しない。
 */
export function createLocalImageStorage(options: { dir: string; baseUrl: string }): ImageStorage {
  const root = path.resolve(options.dir)

  // "../" などで dir の外に書き込まれないよう、キーから作ったパスが dir の中にあるか確かめる
  const resolve = (key: string): string => {
    const filePath = path.resolve(root, key)
    if (!filePath.startsWith(root + path.sep)) {
      throw new Error(`不正なオブジェクトキーです: ${key}`)
    }
    return filePath
  }

  return {
    async put(key, body) {
      const filePath = resolve(key)
      await mkdir(path.dirname(filePath), { recursive: true })
      await writeFile(filePath, body)
    },
    async delete(key) {
      await rm(resolve(key), { force: true })
    },
    url(key) {
      return `${options.baseUrl}/${key.split('/').map(encodeURIComponent).join('/')}`
    },
  }
}
