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
- 管理用 API の保護はインフラ側で行う予定(アプリ側の認証は後回し)

## データモデルの方針

詳細は backend/prisma/schema.prisma を参照。

- 日本語と英語に対応するため、言語ごとのテキストは翻訳テーブルに分ける
- カテゴリ類は Enum にせずテーブルにして、編集画面から増減できるようにする
- 多対多は、後から項目を足せるように、明示的な中間テーブルにする
- 下書き保存は isPublished(true / false)で表す。親が非公開なら子も公開しない(例: 経歴が非公開なら配下の案件も出さない)
- 日時は timestamptz で UTC 保存し、API は UTC で返す。JST への変換は表示側で行う
- 見た目の制御はデータに持たせず、フロントで決める

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
