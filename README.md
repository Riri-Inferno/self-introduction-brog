## なにこれ

自己紹介サイトです。経歴、スキル、個人開発などを公開します。
React、Fastify、Prisma、Zod を TypeScript で書く練習を兼ねています。

画面は2つあります。

- 閲覧画面: 一般ユーザーが見る自己紹介ページ
- 編集画面: 自分だけが使う。経歴などの内容を編集する

バックエンドは1つで、API を共通で使います。

## スタック

| 領域 | 技術 |
|---|---|
| フロント | React, TypeScript |
| バックエンド | Fastify, TypeScript |
| バリデーション | Zod |
| ORM | Prisma 7 |
| DB | PostgreSQL 18 |
| ローカル環境 | Docker Compose(DB のみ) |

## 構成

```
self-introduce/
├── backend/             API サーバー(Fastify + Prisma)
│   ├── prisma/          スキーマ(schema.prisma)
│   ├── prisma.config.ts Prisma のマイグレーション設定
│   └── src/
├── frontend/            閲覧画面・編集画面
├── docker-compose.yml   ローカル用の DB
└── README.md
```

## API の方針

- バックエンド1システムで、パスで用途を分ける
  - /api/public/*: 閲覧用。認証なし、読み取りのみ。公開フラグが true のデータだけ返す
  - /api/admin/*: 管理用。作成、更新、削除。全件を扱う
- OpenAPI は public と admin のタグで区別する
- 管理用 API は、インフラの認証プロキシとアプリでの JWT 検証の両方で保護する(理由は [docs/adr/0012](docs/adr/0012-api-structure-and-admin-protection.md))

## データモデル

定義は backend/prisma/schema.prisma を参照してください。設計判断とその理由は、docs/adr/ に ADR として残しています(一覧は [docs/adr/README.md](docs/adr/README.md))。

## セットアップ

### 全体

前提として次のものが要ります。

- Node.js 22 以上(`node -v` で確認)
- Docker(DB を起動するため)

### DB

リポジトリ直下で実行します。

```bash
docker compose up -d
```

マイグレーションはバックエンドの手順で行います。

### バックエンド

コマンドはすべて backend/ で実行します(手順 1 の `cd backend` で移動します)。

#### 1. 環境変数を用意する

```bash
cd backend
cp .env.example .env
```

すでに `.env` がある場合、この手順は不要です(`cp` で上書きされます)。

`.env` の `DATABASE_URL` は、docker-compose.yml の DB 設定に合わせてあります。ローカルではそのままで動きます。

#### 2. 依存を入れる

```bash
npm install
```

package.json がまだない場合は、先に次のコマンドで作ります(初回の構築時だけ)。

```bash
npm init -y
npm pkg set name=self-introduce-backend type=module
npm pkg set private=true --json
npm pkg delete main scripts.test
npm pkg set scripts.typecheck="tsc --noEmit" scripts.db:generate="prisma generate" scripts.db:migrate="prisma migrate dev"

npm install @prisma/client@7 @prisma/adapter-pg@7 pg dotenv fastify zod
npm install -D prisma@7 typescript @types/node@22 @types/pg tsx
```

`npm install` の後に `npm audit` で high の脆弱性が4件表示されます。どれも Prisma CLI(`prisma` パッケージ)が依存する `deepmerge-ts` と `mysql2` のものです。`npm audit fix --force` は Prisma 6 へのダウングレードになるので実行しないでください。

#### 3. Prisma Client を生成し、型チェックする

```bash
npm run db:generate
npm run typecheck
```

`db:generate` は schema.prisma から `src/generated/prisma/` に型とクライアントを作ります。DB には接続しません。生成物は .gitignore 済みです。

`typecheck` がエラーなしで終われば、セットアップは完了です。

#### 4. マイグレーション

手順は準備ができ次第ここに書きます。CHECK 制約を手で追記するため、`npm run db:migrate` はまだ実行しないでください(理由は [docs/adr/0010](docs/adr/0010-check-constraints-in-migration.md))。

### フロントエンド

準備ができ次第ここに書きます。
