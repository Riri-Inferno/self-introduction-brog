# セットアップ

ローカルで開発環境を作る手順です。コマンドのブロックには、実行場所をリポジトリ直下からの相対パスで書いています。

- [全体](#全体)
- [DB](#db)
- [バックエンド](#バックエンド)
- [フロントエンド](#フロントエンド)
- [スキーマを変えたとき](#スキーマを変えたとき)
- [困ったとき](#困ったとき)

## 全体

前提として次のものが要ります。

- Node.js 22 以上(`node -v` で確認)
- Docker(DB を起動するため)

## DB

PostgreSQL 18 を Docker Compose で起動します。

```bash
# 実行場所: self-introduce/
docker compose up -d
```

接続情報は docker-compose.yml に書いてあります。

| 項目 | 値 |
|------|----|
| Host | `localhost` |
| Port | `5432` |
| Database | `self_introduce` |
| ユーザー名 | `app` |
| パスワード | `app` |
| コンテナ名 | `self-introduce-db` |

DBeaver などの GUI から接続するときも、この値を使います。テーブルの作成は、次のバックエンドの手順で行います。

## バックエンド

### 1. 環境変数を用意する

```bash
# 実行場所: self-introduce/backend
cp .env.example .env
```

すでに `.env` がある場合、この手順は不要です(`cp` で上書きされます)。

`.env` の `DATABASE_URL` は、DB の接続情報に合わせてあります。ローカルではそのままで動きます。

### 2. 依存を入れる

```bash
# 実行場所: self-introduce/backend
npm install
```

`npm audit` で high の脆弱性が4件表示されます。どれも Prisma CLI(`prisma` パッケージ)が依存する `deepmerge-ts` と `mysql2` のものです。

- `deepmerge-ts`: Prisma が `prisma.config.ts` を読み込むときだけ使われます。入力は自分で書いた設定です
- `mysql2`: MySQL 用のドライバです。このプロジェクトは PostgreSQL なので使われません

`npm audit fix --force` は Prisma 6 へのダウングレードになるので、実行しないでください。

### 3. Prisma Client を生成し、型チェックする

```bash
# 実行場所: self-introduce/backend
npm run db:generate
npm run typecheck
```

`db:generate` は schema.prisma から `src/generated/prisma/` に型とクライアントを作ります。DB には接続しません。生成物は .gitignore 済みです。

`typecheck` がエラーなしで終われば成功です。

### 4. マイグレーションを適用する

DB を起動してから実行します。

```bash
# 実行場所: self-introduce/backend
npm run db:migrate
```

`Your database is now in sync with your schema.` と表示されれば完了です。

マイグレーションには、Prisma の schema では書けない CHECK 制約も入っています(理由は [ADR 0010](adr/0010-check-constraints-in-migration.md))。入ったかどうかは次のコマンドで確かめられます。

```bash
# 実行場所: どこでもよい
docker exec self-introduce-db psql -U app -d self_introduce -tAc \
  "SELECT conname FROM pg_constraint WHERE contype = 'c' AND conname LIKE '%\_check' AND connamespace = 'public'::regnamespace ORDER BY conname;"
```

`_locale_check` が8個、`_period_check` が4個、`Profile_id_singleton_check` が1個、合わせて13個表示されれば成功です。

### 5. サーバーを起動する

```bash
# 実行場所: self-introduce/backend
npm run dev
```

ファイルを保存すると自動で再起動します。起動したら、次の URL で確かめられます。

| URL | 内容 |
|-----|------|
| http://localhost:3000/api/public/profile | プロフィール。データがなければ 404 の `NOT_FOUND` が返る |
| http://localhost:3000/docs | OpenAPI の画面(本番では出さない) |

環境変数に誤りがあると、どの変数が誤っているかを表示して起動が止まります。変数の一覧と初期値は [ADR 0016](adr/0016-env-config-validation.md) にあります。

### 6. テストを実行する

テストの書き方と、実行のしかたの詳細は [testing.md](testing.md) にあります。

DB を使わないテストは、DB を起動しなくても実行できます。

```bash
# 実行場所: self-introduce/backend
npm test
```

統合テストは、テスト用の DB `self_introduce_test` を使います。最初に1回だけ DB を作ります。

```bash
# 実行場所: どこでもよい
docker exec self-introduce-db createdb -U app self_introduce_test
```

`.env` に `TEST_DATABASE_URL` がなければ、`.env.example` からコピーして足します。

```bash
# 実行場所: self-introduce/backend
npm run test:integration
```

実行のたびに、マイグレーションを適用してからテストします。テストの前にテーブルを空にするので、`TEST_DATABASE_URL` の DB 名が `_test` で終わっていないと実行を止めます。

## フロントエンド

準備ができ次第ここに書きます。

## スキーマを変えたとき

schema.prisma を変えたら、新しいマイグレーションを作ります。一度コミットしたマイグレーションは編集しません。

```bash
# 実行場所: self-introduce/backend
npx prisma migrate dev --name <変更内容>
```

`--name` には `add_post_tags` のように、変更内容が分かる名前を付けます。

### CHECK 制約を足すとき

CHECK 制約は schema.prisma に書けないので、マイグレーション SQL を作ってから手で追記します。

1. SQL だけを作る(DB には適用しない)
   ```bash
   # 実行場所: self-introduce/backend
   npx prisma migrate dev --create-only --name <変更内容>
   ```
2. `prisma/migrations/<日時>_<変更内容>/migration.sql` の末尾に、`ALTER TABLE ... ADD CONSTRAINT ... CHECK (...)` を追記する。書き方は `prisma/migrations/*_init/migration.sql` の末尾を参考にする
3. DB に適用する
   ```bash
   # 実行場所: self-introduce/backend
   npm run db:migrate
   ```

Prisma は schema にない CHECK 制約を差分として扱わないので、後のマイグレーションで制約が消されることはありません。

## 困ったとき

### DB につながらない

- `docker ps` で `self-introduce-db` が `Up` になっているか確かめる
- Windows 側にも PostgreSQL が入っていると、5432 番ポートがそちらに取られて認証エラーになる。この場合は docker-compose.yml のポートを `"5433:5432"` のように変え、`.env` の `DATABASE_URL` のポートも合わせる

### テストや起動が遅い

WSL で、リポジトリを Windows 側(`/mnt/c/...`)に置いていると、ファイルの読み込みが遅くなります。`@fastify/swagger` の読み込みに数秒かかるなど、起動やテストに時間がかかります。WSL 側(`~/` 以下)にリポジトリを置くと速くなります。

### DB を作り直したい

```bash
# 実行場所: self-introduce/backend
npx prisma migrate reset
```

DB のデータをすべて消し、マイグレーションを最初から適用し直します。
