// 起動処理。実装の組み立て(DI)はこのファイルでだけ行う(ADR 0013)
// ここ以外のファイルは、使う相手を引数で受け取るだけで、実装を自分で作らない
//
// このファイルの流れ
//   1. 設定を読む
//   2. 外部とつなぐ部品(DB、画像ストレージ)を作る
//   3. ユースケースを組み立てる(DI)
//   4. Fastify を組み立てる
//   5. 終了処理を登録して、起動する
//
// CORS、認証、ルートの登録など HTTP の設定は、ここではなく app.ts の buildApp に書く
// buildApp はテストでも使うので、そちらに書けばテストにも同じ設定がかかる

import 'dotenv/config'
import { buildApp } from './app.js'
import { createGetPublicProfile } from './application/profile/get-public-profile.js'
import { createGetPublicSkills } from './application/skill/get-public-skills.js'
import { ConfigError, loadConfig, type Config } from './infrastructure/config.js'
import { createPrismaClient } from './infrastructure/prisma/client.js'
import { createPrismaPublicProfileQuery } from './infrastructure/prisma/prisma-public-profile-query.js'
import { createPrismaPublicSkillQuery } from './infrastructure/prisma/prisma-public-skill-query.js'
import { createLocalImageStorage } from './infrastructure/storage/local-image-storage.js'

// ---------------------------------------------------------------
// 1. 設定を読む
// 誤りがあれば、どの環境変数が誤っているかを表示して止める(ADR 0016)
// ---------------------------------------------------------------

function readConfig(): Config {
  try {
    return loadConfig(process.env)
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error(error.message)
      process.exit(1)
    }
    throw error
  }
}

const config = readConfig()

// ---------------------------------------------------------------
// 2. 外部とつなぐ部品を作る
// 1つを複数のユースケースで使い回す。本番用の画像ストレージ(S3 など)に
// 切り替えるときは、ここで作るものを変える(ADR 0011)
// ---------------------------------------------------------------

const prisma = createPrismaClient(config.databaseUrl)
const imageStorage = createLocalImageStorage(config.storage)

// ---------------------------------------------------------------
// 3. ユースケースを組み立てる(DI)
// application 層が定義したインターフェースに、infrastructure 層の実装を渡す
// API を足したら、ここにユースケースを足す(docs/backend-api.md の手順 6)
// ---------------------------------------------------------------

const usecases = {
  getPublicProfile: createGetPublicProfile({
    profileQuery: createPrismaPublicProfileQuery(prisma),
    imageStorage,
  }),
  getPublicSkills: createGetPublicSkills({
    skillQuery: createPrismaPublicSkillQuery(prisma),
  }),
}

// ---------------------------------------------------------------
// 4. Fastify を組み立てる
// ---------------------------------------------------------------

const app = await buildApp({
  logger: { level: config.logLevel },
  docs: config.nodeEnv !== 'production',
  usecases,
})

// ---------------------------------------------------------------
// 5. 終了処理を登録して、起動する
// Ctrl+C やコンテナの停止で、処理中のリクエストを終えてから DB の接続を閉じる
// ---------------------------------------------------------------

app.addHook('onClose', async () => {
  await prisma.$disconnect()
})

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    app.log.info(`${signal} を受け取ったので終了します`)
    void app.close()
  })
}

await app.listen({ host: config.host, port: config.port })
