# ADR 0017: テストは Vitest で、DB を使わないテストと、テスト用 DB を使う統合テストに分ける

- **Date**: 2026-10-15
- **Status**: Accepted

## Context

API を実装する前に、テストの書き方を決めておきたい。すべてのテストで DB を使うと、テストが遅くなり、DB を起動しないとテストできない。一方で、Prisma のクエリや DB の制約は、本物の DB でしか確かめられない。

[0010](0010-check-constraints-in-migration.md) で、CHECK 制約を統合テストで確かめるかを保留していた。

## Decision

### テストの種類

テストランナーは Vitest を使う。テストを次の3種類に分ける。

| 種類 | 対象 | DB | 実行するコマンド |
|------|------|----|------------------|
| ユニットテスト | domain、application | 使わない。リポジトリはフェイクを渡す | `npm test` |
| API テスト | presentation。`buildApp` にフェイクを渡し、`app.inject()` でリクエストを送る | 使わない | `npm test` |
| 統合テスト | infrastructure の Prisma の実装と、DB の制約 | テスト用 DB を使う | `npm run test:integration` |

- `buildApp` に依存を渡せるので([0013](0013-backend-layered-architecture.md))、API テストではサーバーを起動せず、DB も使わない
- API テストでは、レスポンスの形([0015](0015-response-envelope.md))と、閲覧用 API に管理用の項目が出ないこともあわせて確かめる
- Vitest の projects 機能で、DB を使わないテストと統合テストを分ける

### テスト用 DB

- 開発用と同じコンテナに、別の DB `self_introduce_test` を作る。開発用のデータを消さないため
- 統合テストの前に、`prisma migrate deploy` でマイグレーションを適用する。CHECK 制約も一緒に入る
- 各テストの前にテーブルを空にする。テスト同士が DB を取り合わないよう、統合テストは1ファイルずつ順に実行する

### CHECK 制約の確認

[0010](0010-check-constraints-in-migration.md) で保留していた、CHECK 制約の統合テストを書く。`locale = 'jp'` や、開始日より前の終了日を INSERT するとエラーになることを確かめる。マイグレーションで制約を入れ忘れたときに気づける。

### 検討した選択肢

| 案 | 内容 | 採否 |
|----|------|------|
| A | Vitest。DB を使わないテストと、テスト用 DB の統合テストを分ける | 採用 |
| B | すべてのテストでテスト用 DB を使う | 不採用(遅く、DB を起動しないとテストできない) |
| C | 統合テストを Testcontainers で、テストごとにコンテナを立てて行う | 不採用(テストの起動が遅い。ローカルにはすでに DB のコンテナがある) |
| D | テストランナーに Node.js 標準の `node:test` を使う | 不採用(TypeScript の実行、モック、projects 機能を自分で用意することになる) |

## Consequences

- 普段の開発では、DB を起動せずに `npm test` でテストできる
- 統合テストの前に、テスト用 DB を作っておく必要がある(手順は docs/setup.md に書く)
- フェイクの実装が、本物の Prisma の実装とずれるおそれがある。ずれは統合テストで見つける
- 将来 CI で統合テストを動かすときは、CI 上に PostgreSQL を用意する
