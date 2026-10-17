# テストの実装と実行

バックエンドのテストの書き方と実行方法です。方針は [ADR 0017](adr/0017-testing-strategy.md) にあります。コマンドのブロックには、実行場所をリポジトリ直下からの相対パスで書いています。

- [テストの種類](#テストの種類)
- [準備](#準備)
- [実行する](#実行する)
- [テストの書き方の決まり](#テストの書き方の決まり)
- [ユニットテストを書く](#ユニットテストを書く)
- [API テストを書く](#api-テストを書く)
- [統合テストを書く](#統合テストを書く)
- [困ったとき](#困ったとき)

## テストの種類

| 種類 | 対象 | DB | ファイル名 | 見本 |
|------|------|----|-----------|------|
| ユニットテスト | domain、application | 使わない | `*.test.ts` | `src/application/profile/get-public-profile.test.ts` |
| API テスト | presentation(ルート) | 使わない | `*.test.ts` | `src/presentation/routes/public/profile.test.ts` |
| 統合テスト | infrastructure(Prisma の実装)、DB の制約 | テスト用 DB | `*.int.test.ts` | `src/infrastructure/prisma/prisma-public-profile-query.int.test.ts` |

- テストのファイルは、テストする対象のファイルの隣に置きます
- ファイル名の末尾で種類が決まります。`*.int.test.ts` は統合テスト、それ以外の `*.test.ts` は DB を使わないテストです(`vitest.config.ts` で分けています)
- テストのファイルはビルド(`npm run build`)には含まれません

## 準備

DB を使わないテストは、`npm install` が済んでいれば準備は要りません。

統合テストは、最初に1回だけ次の準備をします。

1. DB を起動する
   ```bash
   # 実行場所: self-introduce/
   docker compose up -d
   ```
2. テスト用の DB を作る
   ```bash
   # 実行場所: どこでもよい
   docker exec self-introduce-db createdb -U app self_introduce_test
   ```
3. `backend/.env` に `TEST_DATABASE_URL` を足す。値は `.env.example` からコピーする
   ```
   TEST_DATABASE_URL="postgresql://app:app@localhost:5432/self_introduce_test"
   ```

マイグレーションは、統合テストを実行するたびに自動で適用されます。手で適用する必要はありません。

## 実行する

```bash
# 実行場所: self-introduce/backend

# DB を使わないテストをすべて実行する
npm test

# 統合テストをすべて実行する(DB の起動が必要)
npm run test:integration
```

開発中によく使う実行のしかたです。

```bash
# 実行場所: self-introduce/backend

# ファイルを保存するたびに、関係するテストを実行し直す(終了は q)
npx vitest --project unit

# 1つのファイルだけ実行する
npx vitest run src/application/profile/get-public-profile.test.ts

# テスト名で絞り込む(名前の一部でよい)
npx vitest run --project unit -t "英訳がなければ"

# 異常系のテストだけを実行する
npx vitest run --project unit -t "異常系"
```

すべて通ると、最後に `Test Files  N passed` と表示されます。失敗したテストは `FAIL` と、期待した値と実際の値の差が表示されます。

## テストの書き方の決まり

どの種類のテストも、次の2つの決まりで書きます。

### テスト名の頭に、正常系か異常系かを書く

```ts
it('[正常系] 英訳がなければ日本語を返す', ...)
it('[異常系] プロフィールがなければ NotFoundError を投げる', ...)
```

| 区分 | 対象 |
|------|------|
| `[正常系]` | 想定どおりの入力で、期待した結果が返る場合 |
| `[異常系]` | 不正な入力、データがない、エラーが起きる場合 |

テストの一覧で、異常系のテストが足りているかを見分けられます。

### Arrange / Act / Assert の3つに分けて書く

各テストを、コメントで3つに分けます。

| 区分 | 書くこと |
|------|----------|
| `// Arrange` | 準備。フェイクやテストデータを作る |
| `// Act` | 実行。テストする関数や API を1回だけ呼ぶ |
| `// Assert` | 確認。結果が期待どおりかを `expect` で確かめる |

準備が要らないときも、`// Arrange` は省かず、理由をコメントで書きます(例: `// DB は beforeEach で空にしてある`)。

エラーを確かめるときは、Act で `await` を付けずに結果を変数に入れ、Assert で `rejects` に渡します。Act で `await` すると、そこでエラーが投げられてテストが落ちます。

```ts
// Act
const result = getPublicProfile({ locale: 'ja' })

// Assert
await expect(result).rejects.toThrow(NotFoundError)
```

同期の関数のエラーは、呼び出しを関数で包んで Act に置きます。

```ts
// Act
const act = () => loadConfig({})

// Assert
expect(act).toThrow(ConfigError)
```

## ユニットテストを書く

`src/application/<名前>/get-public-<名前>.test.ts` を作ります。見本は `src/application/profile/get-public-profile.test.ts` です。

domain 層の関数のテストも同じ書き方です。見本は `src/domain/translation.test.ts` です。

ユースケースには、DB を使わないフェイクの実装を渡します。フェイクは、インターフェースを満たすオブジェクトをテストの中で作るだけです。モックのライブラリは使いません。

```ts
import { describe, expect, it } from 'vitest'
import { NotFoundError } from '../../domain/errors.js'
import { createGetPublicProfile } from './get-public-profile.js'
import type { PublicProfileQuery, PublicProfileRecord } from './public-profile-query.js'

// 抜粋。fakeImageStorage などの定義は見本のファイルを参照

// インターフェースを満たすフェイク。返す値をテストごとに決められる
function fakeProfileQuery(record: PublicProfileRecord | null): PublicProfileQuery {
  return { find: async () => record }
}

describe('getPublicProfile', () => {
  it('[異常系] プロフィールがなければ NotFoundError を投げる', async () => {
    // Arrange
    const getPublicProfile = createGetPublicProfile({
      profileQuery: fakeProfileQuery(null),
      imageStorage: fakeImageStorage,
    })

    // Act
    const result = getPublicProfile({ locale: 'ja' })

    // Assert
    await expect(result).rejects.toThrow(NotFoundError)
  })
})
```

書くこと:

- 正常なとき、期待した形のデータを返すこと
- 翻訳がないときに `ja` で返すこと(翻訳テーブルを持つモデルなら)
- データがないときに、決めたとおりのエラーを投げるか、空の配列を返すこと

フェイクは、本物の実装と同じ約束を守るように作ります。見本の `fakeProfileQuery` は、本物と同じく、指定した言語の翻訳だけを返します。約束がずれると、フェイクでは通るのに本物では動かない、ということが起きます。

## API テストを書く

`src/presentation/routes/public/<名前>.test.ts` を作ります。見本は `src/presentation/routes/public/profile.test.ts` です。

`buildApp` にフェイクのユースケースを渡し、`app.inject()` でリクエストを送ります。サーバーは起動しません。

ユースケースは `src/test/fake-usecases.ts` の `fakeUsecases` で作ります。テストで使うものだけを引数で差し替えます。差し替えなかったユースケースは、呼ばれるとエラーを投げてテストを失敗させます。

```ts
import { describe, expect, it } from 'vitest'
import { buildApp } from '../../../app.js'
import { fakeUsecases } from '../../../test/fake-usecases.js'

// 抜粋。profile の定義は見本のファイルを参照

describe('GET /api/public/profile', () => {
  it('[正常系] data で包んで返す', async () => {
    // Arrange
    const app = await buildApp({
      usecases: fakeUsecases({ getPublicProfile: async () => profile }),
    })

    // Act
    const res = await app.inject({ method: 'GET', url: '/api/public/profile' })

    // Assert
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ data: { ...profile, updatedAt: '2026-10-01T00:00:00.000Z' } })
  })
})
```

書くこと:

- 200 で、`{ data }` の形で返すこと。日時や日付が文字列になっていること
- クエリが不正なとき、400 の `VALIDATION_ERROR` を返すこと
- ユースケースが `NotFoundError` を投げたとき、404 の `NOT_FOUND` を返すこと(使う API なら)
- スキーマにない項目(`isPublished`、画像のキーなど)がレスポンスに出ないこと

### ユースケースを足したとき

`PublicUsecases` にユースケースを足したら、`src/test/fake-usecases.ts` にも1行足します。足し忘れると型エラーになります。

```ts
export function fakeUsecases(overrides: Partial<PublicUsecases> = {}): PublicUsecases {
  return {
    getPublicProfile: notCalled,
    getPublicSkills: notCalled,
    getPublic<Name>: notCalled,   // 追加
    ...overrides,
  }
}
```

直すのはこのファイルだけです。ほかの API のテストは `fakeUsecases` を使っているので、直さなくてかまいません。

使わないユースケースに、`async () => []` のような普通の値を返すフェイクは渡しません。間違って呼ばれてもテストが通ってしまい、気づけないからです。

## 統合テストを書く

`src/infrastructure/prisma/prisma-public-<名前>-query.int.test.ts` を作ります。見本は `src/infrastructure/prisma/prisma-public-profile-query.int.test.ts` です。

テスト用 DB に Prisma でデータを入れ、infrastructure の実装を呼びます。`src/test/integration/db.ts` の関数を使います。

| 関数 | 用途 |
|------|------|
| `createTestPrisma()` | テスト用 DB につなぐ Prisma Client を作る |
| `resetDatabase(prisma)` | マイグレーションの履歴以外のテーブルをすべて空にする |

```ts
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestPrisma, resetDatabase } from '../../test/integration/db.js'
import { createPrismaPublicProfileQuery } from './prisma-public-profile-query.js'

const prisma = createTestPrisma()
const query = createPrismaPublicProfileQuery(prisma)

// テストごとに DB を空にする。前のテストのデータが残らないようにするため
beforeEach(async () => {
  await resetDatabase(prisma)
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('PrismaPublicProfileQuery.find', () => {
  it('[正常系] 指定した言語の翻訳だけを返す', async () => {
    // Arrange
    await prisma.profile.create({
      data: { translations: { create: [{ locale: 'ja', name: '山田 太郎' }] } },
    })

    // Act
    const profile = await query.find(['ja'])

    // Assert
    expect(profile?.translations).toHaveLength(1)
  })
})
```

書くこと:

- 非公開のデータが返らないこと。親が非公開の子も返らないこと
- 指定した言語の翻訳だけを返すこと
- 並び順が `sortOrder` のとおりになること

統合テストは1ファイルずつ順に実行されます。同じファイルの中のテストも順に実行されるので、`beforeEach` で空にすれば、テスト同士でデータは混ざりません。

### CHECK 制約を足したとき

`src/infrastructure/prisma/check-constraints.int.test.ts` にテストを足し、制約の数(今は13個)も直します。マイグレーション SQL への追記を忘れたときに気づけます([ADR 0010](adr/0010-check-constraints-in-migration.md))。

## 困ったとき

### `TEST_DATABASE_URL が設定されていません` と出る

`backend/.env` に `TEST_DATABASE_URL` を足してください([準備](#準備)の3)。

### `DB 名は _test で終わる必要があります` と出る

`TEST_DATABASE_URL` が開発用の DB を指しています。統合テストはテーブルを空にするので、開発用の DB のデータを消さないよう止めています。DB 名を `self_introduce_test` にしてください。

### `database "self_introduce_test" does not exist` と出る

テスト用の DB がまだありません。[準備](#準備)の2を実行してください。`docker compose down -v` でボリュームを消したときも、作り直しが要ります。

### `Test timed out in 5000ms` と出る

WSL でリポジトリを Windows 側(`/mnt/c/...`)に置いていると、最初の読み込みに時間がかかることがあります。2回目以降も続くなら、`await` の付け忘れや、終わらない Promise がないか確かめてください。

### 統合テストで、前のテストのデータが残っている

`beforeEach` で `resetDatabase(prisma)` を呼んでいるか確かめてください。
