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

## 起動手順(予定)

DB を起動します。

```bash
docker compose up -d
```

バックエンドのセットアップは、準備ができ次第ここに書きます。

```bash
cd backend
npm install
npx prisma migrate dev
```
