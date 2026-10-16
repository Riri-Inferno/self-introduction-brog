# バックエンド API の実装手順

閲覧用 API(`/api/public/*`)を1本足すときの手順です。`GET /api/public/profile` を見本にしています。コマンドのブロックには、実行場所をリポジトリ直下からの相対パスで書いています。

テストの書き方と実行方法は [testing.md](testing.md) にあります。

- [全体の流れ](#全体の流れ)
- [見本のファイル](#見本のファイル)
- [作る前に決めること](#作る前に決めること)
- [手順](#手順)
- [守ること](#守ること)
- [仕上げのチェックリスト](#仕上げのチェックリスト)
- [困ったとき](#困ったとき)

## 全体の流れ

`backend/src/` は層に分かれています(理由は [ADR 0013](adr/0013-backend-layered-architecture.md))。リクエストは次の順に流れます。

```
HTTP リクエスト
  → presentation   ルート。Zod でクエリを検証し、ユースケースを呼ぶ
  → application    ユースケース。インターフェースを通してデータを取る
  → infrastructure Prisma の実装。DB を読む
  ← application    翻訳を選ぶ、画像のキーを URL にする、などの処理
  ← presentation   { data } で包み、Zod のスキーマに合わせて返す
```

依存の向きは `presentation → application → domain ← infrastructure` です。内側の層は外側の層を import しません。

実装どうしをつなぐのは `main.ts` だけです。各層は、使う相手を引数で受け取ります。

## 見本のファイル

`GET /api/public/profile` は、次のファイルでできています。新しい API も同じ並びで作ります。

| 層 | ファイル | 中身 |
|----|----------|------|
| domain | `src/domain/locale.ts` | 言語の型と `DEFAULT_LOCALE` |
| domain | `src/domain/translation.ts` | 翻訳を選ぶ `selectTranslation` |
| domain | `src/domain/errors.ts` | `NotFoundError` などの業務上のエラー |
| application | `src/application/profile/public-profile-query.ts` | 読み取り用のインターフェースと、返すデータの型 |
| application | `src/application/profile/get-public-profile.ts` | ユースケース |
| infrastructure | `src/infrastructure/prisma/public-profile-query.ts` | インターフェースの Prisma での実装 |
| presentation | `src/presentation/routes/public/profile.ts` | レスポンスのスキーマとルート |
| presentation | `src/presentation/routes/public/index.ts` | `/api/public` 以下のルートをまとめて登録する |
| 組み立て | `src/main.ts` | 実装を作り、ユースケースに渡す |

## 作る前に決めること

コードを書く前に、次の4点を決めます。

1. **パスと返す形**: `GET /api/public/<名前>` で、`data` に何を入れるか。一覧なら配列にする([ADR 0015](adr/0015-response-envelope.md))
2. **公開の判定**: `isPublished` を持つモデルか。親子関係があるなら、親の `isPublished` も条件に入れる([ADR 0005](adr/0005-publish-flag.md))
3. **言語**: 翻訳テーブルを持つモデルか。持つなら `?locale` を受け取り、`selectTranslation` で選ぶ([ADR 0018](adr/0018-locale-fallback.md))
4. **日付**: `@db.Date` の項目があるか。あれば `"YYYY-MM-DD"` の文字列で返す([ADR 0006](adr/0006-date-and-datetime.md))

以下の手順では、名前を `<名前>`(ファイル名、例: `skill`)、`<Name>`(型名、例: `Skill`)と書きます。

## 手順

### 1. 読み取り用のインターフェースを定義する

`src/application/<名前>/public-<名前>-query.ts` を作ります。見本は `public-profile-query.ts` です。

```ts
import type { Locale } from '../../domain/locale.js'

// DB から取り出す形。Prisma の型は使わず、ここで定義する
export interface Public<Name>Record {
  // ...
}

export interface Public<Name>Query {
  // 公開済みのものだけを返す、などの約束事をコメントに書く
  findAll(locales: readonly Locale[]): Promise<Public<Name>Record[]>
}
```

- Prisma の型(`generated/prisma`)は import しません。この層は Prisma を知らない約束です
- 公開の判定のような約束事は、メソッドのコメントに書きます。実装はそれを守ります

### 2. ユースケースを作る

`src/application/<名前>/get-public-<名前>.ts` を作ります。見本は `get-public-profile.ts` です。

```ts
export interface Public<Name> {
  // 画面に返す形。DB の形とは分けて定義する
}

export type GetPublic<Name> = (input: { locale: Locale }) => Promise<Public<Name>[]>

export function createGetPublic<Name>(deps: {
  <名前>Query: Public<Name>Query
}): GetPublic<Name> {
  return async ({ locale }) => {
    const records = await deps.<名前>Query.findAll([locale, DEFAULT_LOCALE])
    // 翻訳を選ぶ、URL を組み立てる、などの処理をここに書く
  }
}
```

- 使う相手(クエリ、画像ストレージなど)は `deps` で受け取ります。ファイルの中で実装を import しません
- データがないときは `throw new NotFoundError('...')` を投げます。HTTP のステータスはここでは決めません
- 一覧が0件なのは正常です。空の配列を返します

### 3. Prisma で実装する

`src/infrastructure/prisma/public-<名前>-query.ts` を作ります。見本は `public-profile-query.ts` です。

```ts
export function createPrismaPublic<Name>Query(prisma: PrismaClient): Public<Name>Query {
  return {
    async findAll(locales) {
      const rows = await prisma.<モデル>.findMany({
        where: { isPublished: true },          // 公開の判定
        orderBy: { sortOrder: 'asc' },
        select: {
          // 返す項目だけを select する
          translations: { where: { locale: { in: [...locales] } } },
        },
      })
      // DB の locale は string なので、isLocale で Locale 型に絞る
    },
  }
}
```

- `select` で、使う項目だけを取ります。`include` で全部取りません
- 公開の判定は `where` に書きます。親子関係があるなら `where: { isPublished: true, <親>: { isPublished: true } }` のように親も条件に入れます
- 並び順は `sortOrder` で決まります。同じ値のときの順番も決まるよう、2つ目の並び順(`id` など)も指定します

### 4. ルートを作る

`src/presentation/routes/public/<名前>.ts` を作ります。見本は `profile.ts` です。

```ts
const public<Name>Schema = z
  .object({
    // レスポンスに出す項目だけを書く。ここにない項目は出力されない
  })
  .meta({ id: 'Public<Name>' })

export function public<Name>Routes(deps: {
  getPublic<Name>: GetPublic<Name>
}): FastifyPluginAsyncZod {
  return async (app) => {
    app.get(
      '/<名前>s',
      {
        schema: {
          tags: ['public'],
          summary: '<何を>取得する',
          querystring: localeQuerySchema,
          response: {
            200: dataResponse(z.array(public<Name>Schema)),
            400: errorResponseSchema,
          },
        },
      },
      async (request) => {
        const items = await deps.getPublic<Name>({ locale: request.query.locale })
        return { data: items.map(/* Date を文字列にする */) }
      },
    )
  }
}
```

- `tags` には必ず `public` を付けます([ADR 0012](adr/0012-api-structure-and-admin-protection.md))
- `response` には、返しうるステータスをすべて書きます。OpenAPI に出ます
- `.meta({ id })` を付けると、OpenAPI の `components.schemas` に名前付きで出ます
- 日時(timestamptz)は `z.iso.datetime()` にして、ルートで `date.toISOString()` に変換します
- 日付(`@db.Date`)は `z.iso.date()` にして、ルートで `date.toISOString().slice(0, 10)` に変換します
- エラーはルートで返さず、ユースケースから投げます。`error-handler.ts` が `{ error }` の形に変換します

### 5. ルートを登録する

`src/presentation/routes/public/index.ts` の `PublicUsecases` にユースケースを足し、`register` します。

```ts
export interface PublicUsecases {
  getPublicProfile: GetPublicProfile
  getPublic<Name>: GetPublic<Name>          // 追加
}

export function publicRoutes(usecases: PublicUsecases): FastifyPluginAsyncZod {
  return async (app) => {
    await app.register(publicProfileRoutes(usecases))
    await app.register(public<Name>Routes(usecases))   // 追加
  }
}
```

ここで型チェックをすると、`main.ts` とテストの `buildApp` の呼び出しで、`getPublic<Name>` がないというエラーが出ます。次の手順で直します。

### 6. main.ts で組み立てる

`src/main.ts` の `usecases` に足します。

```ts
usecases: {
  getPublicProfile: createGetPublicProfile({ ... }),
  getPublic<Name>: createGetPublic<Name>({
    <名前>Query: createPrismaPublic<Name>Query(prisma),
  }),
},
```

既存のテストの `buildApp` の呼び出しにも、フェイクのユースケースを足します。

### 7. 型チェックとテスト

```bash
# 実行場所: self-introduce/backend
npm run typecheck
npm test
```

テストの書き方は [testing.md](testing.md) を参照してください。ユースケース、ルート、Prisma の実装の3つにテストを書きます。

### 8. 動かして確かめる

```bash
# 実行場所: self-introduce/backend
npm run dev
```

別のターミナルで確かめます。

```bash
# 実行場所: どこでもよい
curl -s "http://localhost:3000/api/public/<名前>s?locale=ja"
curl -s "http://localhost:3000/api/public/<名前>s?locale=fr"   # 400 VALIDATION_ERROR になる
```

http://localhost:3000/docs を開き、新しい API が `public` タグの下に出ていることも確かめます。

## 守ること

| ルール | 理由 |
|--------|------|
| 相対パスの import には `.js` を付ける(`'./profile.js'`) | `module: nodenext` では拡張子が必須 |
| Prisma の生成物を import するのは infrastructure だけ | [ADR 0013](adr/0013-backend-layered-architecture.md) |
| `process.env` を読むのは `infrastructure/config.ts` だけ | [ADR 0016](adr/0016-env-config-validation.md)。環境変数を足したら `.env.example` と ADR 0016 の表も直す |
| レスポンスは `{ data }`、エラーは domain のエラーを投げる | [ADR 0015](adr/0015-response-envelope.md) |
| 閲覧用 API には GET だけを登録する | [ADR 0012](adr/0012-api-structure-and-admin-protection.md) |
| 画像はキーを URL にして返す(`imageStorage.url(key)`) | [ADR 0008](adr/0008-image-object-key.md)。キーそのものは返さない |

## 仕上げのチェックリスト

- [ ] `npm run typecheck` がエラーなしで終わる
- [ ] `npm test` が通る
- [ ] `npm run test:integration` が通る
- [ ] 非公開のデータ(親が非公開のものを含む)がレスポンスに出ない
- [ ] `?locale=en` で英訳がないとき、日本語で返る
- [ ] `/docs` に新しい API が出ている
- [ ] 新しい判断をしたら ADR を書いた

## 困ったとき

### `Cannot find module './xxx'` と出る

相対パスの import に `.js` が付いているか確かめてください。ファイルは `.ts` でも、import では `.js` と書きます。

### レスポンスが 500 になり、ログに `Response doesn't match the schema` と出る

ルートが返した値が、`response` のスキーマに合っていません。よくある原因は次の2つです。

- `Date` を文字列に変換せずに返している
- `null` になりうる項目に `.nullable()` を付けていない

### 型チェックで `getPublic<Name>` がないと出る

手順 6 のとおり、`main.ts` とテストの `buildApp` の呼び出しにユースケースを足してください。
