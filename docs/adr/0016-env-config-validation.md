# ADR 0016: 環境変数は起動時に Zod で検証し、任意の項目は未設定なら初期値を使う

- **Date**: 2026-10-15
- **Status**: Accepted

## Context

環境変数をコードのあちこちで `process.env` から直接読むと、次の問題が起きる。

- 必須の値が足りなくても起動してしまい、その値を使う処理が動いたときに初めてエラーになる
- どの環境変数を使っているかが、コード全体を探さないと分からない
- 値がすべて文字列なので、数値や真偽値への変換をあちこちで書くことになる
- テストで値を差し替えにくい

一方で、任意の項目まで設定を必須にすると、ローカル開発で `.env` に書くことが増える。

## Decision

### 1か所で読んで検証する

- `infrastructure/config.ts` の `loadConfig(env)` で、環境変数を Zod のスキーマで検証し、型の付いた設定オブジェクトを返す
- 検証に失敗したら、どの変数がどう誤っているかをすべて表示して、起動を止める
- `process.env` を読むのは `loadConfig` だけにする。設定オブジェクトは `main.ts` から各層に渡す([0013](0013-backend-layered-architecture.md))
- `loadConfig` は引数で環境変数を受け取る。テストでは任意の値を渡す
- `.env` は `main.ts` の先頭の `import 'dotenv/config'` で読む。すでに設定されている環境変数は `.env` で上書きしない(dotenv の既定の動作)

### 任意の項目は初期値を使う

- 必須にするのは、ないと動かない項目だけにする
- 任意の項目は、未設定なら初期値を使う。`.env` に書かなくても動く
- 空文字(`PORT=` のように値を書いていない行)は未設定として扱い、初期値を使う
- アプリが自分で使う項目だけを定義する。ライブラリが自分で読む環境変数には初期値を入れず、ライブラリの既定の動作に任せる

今の時点の項目は次のとおりにする。

| 変数 | 必須 | 初期値 | 用途 |
|------|------|--------|------|
| `DATABASE_URL` | 必須 | なし | DB の接続先 |
| `NODE_ENV` | 任意 | `development` | `development` / `test` / `production` のどれか |
| `HOST` | 任意 | `127.0.0.1` | 待ち受けるアドレス。コンテナで動かすときは `0.0.0.0` を設定する |
| `PORT` | 任意 | `3000` | 待ち受けるポート |
| `LOG_LEVEL` | 任意 | `info` | ログの出力レベル |
| `STORAGE_DIR` | 任意 | `.storage` | ローカルの画像の置き場所([0011](0011-local-image-storage.md)) |
| `STORAGE_BASE_URL` | 任意 | `http://localhost:<PORT>/storage` | 画像の URL の先頭部分([0008](0008-image-object-key.md)) |

統合テストが使う `TEST_DATABASE_URL` は、テストのコードだけが読む。`loadConfig` では扱わない([0017](0017-testing-strategy.md))。

管理用 API の JWT 検証に使う項目は、認証プロキシのサービスを決めたときに足す([0012](0012-api-structure-and-admin-protection.md))。

### 検討した選択肢

| 案 | 内容 | 採否 |
|----|------|------|
| A | `loadConfig` で Zod で検証し、設定オブジェクトを渡す | 採用 |
| B | 各所で `process.env` を直接読む | 不採用(設定の不足に起動時に気づけない) |
| C | `@fastify/env` を使う | 不採用(設定が Fastify のインスタンスに結び付き、Fastify の外の層から使いにくい。プロジェクトで使う Zod とも別の書き方になる) |

## Consequences

- 設定の不足や誤りに、起動した時点で気づける
- 使っている環境変数が `config.ts` を見れば分かる
- 環境変数を足すときは、`config.ts`、`.env.example`、この表の3か所を直す
- Prisma CLI は `prisma.config.ts` で `.env` を別に読むので、`loadConfig` とは関係なく動く
