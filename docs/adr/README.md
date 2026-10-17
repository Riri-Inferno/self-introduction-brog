# Architecture Decision Records (ADR)

本リポジトリの設計判断を時系列で記録する場所。コードやスキーマだけでは追えない「なぜそうしたか」を残す。

## ADR とは

1ファイル = 1つの設計判断を、軽量なテンプレートで残すドキュメント形式。

典型的なセクション：

- **Context**: なぜこの決定が必要になったか / 何が問題か
- **Decision**: 何を決めたか
- **Consequences**: その決定により何が起きるか / 何を諦めるか

## このリポジトリでの運用ルール

- ファイル名は `NNNN-kebab-case-title.md`（連番）
- 新しく書くときは [template.md](template.md) をコピーする
- **一度 Accepted になった ADR 本文は削除・編集しない**。方針を変える場合は新しい ADR を起こし、supersede 関係は新 ADR とこの index で示す
- Status は下記インデックスの表で分けて示す
- 相互依存の強い決定は1ファイルにまとめて構わない

## インデックス

Status ごとに表を分けている。Status が変わったら、行を該当する表へ移す。ファイルは移動しない。

### Proposed(検討中)

| 番号 | タイトル |
|------|----------|
| [0012](0012-api-structure-and-admin-protection.md) | API は用途ごとにパスを分け、管理用 API はインフラとアプリの両方で保護する |

### Accepted(採用)

| 番号 | タイトル |
|------|----------|
| [0001](0001-data-model-overview.md) | データモデルの全体構成 |
| [0002](0002-translation-tables.md) | 日英対応は翻訳テーブル方式にする |
| [0003](0003-skill-category-as-table.md) | カテゴリ類はテーブルにし、スキルは親子関係を持たない |
| [0004](0004-skill-master-and-join-tables.md) | スキルは独立したマスタにし、案件・個人開発とは明示的な中間テーブルでつなぐ |
| [0005](0005-publish-flag.md) | 公開・下書きは isPublished で表し、親が非公開なら子も出さない |
| [0006](0006-date-and-datetime.md) | 日時は timestamptz で UTC 保存し、年月だけの日付は1日で保存する |
| [0007](0007-updated-at-propagation.md) | 翻訳や中間テーブルを更新したときも親の updatedAt を更新する (0002 補足) |
| [0008](0008-image-object-key.md) | 画像はストレージのオブジェクトキーで持ち、URL は API で組み立てる |
| [0009](0009-social-link-host-detection.md) | 外部リンクのサービスは URL のホストで判定する |
| [0010](0010-check-constraints-in-migration.md) | CHECK 制約はマイグレーション SQL に手で追記する |
| [0011](0011-local-image-storage.md) | ローカル開発では画像をローカルのファイルに置く (0008 補足) |
| [0013](0013-backend-layered-architecture.md) | バックエンドはクリーンアーキテクチャに沿って層を分け、依存は外から渡す |
| [0014](0014-zod-schema-as-api-contract.md) | API の入出力は Zod のスキーマで1回だけ定義し、検証・型・OpenAPI に使い回す |
| [0015](0015-response-envelope.md) | レスポンスの本文は、成功時は data、失敗時は error で包む形に統一する |
| [0016](0016-env-config-validation.md) | 環境変数は起動時に Zod で検証し、任意の項目は未設定なら初期値を使う |
| [0017](0017-testing-strategy.md) | テストは Vitest で、DB を使わないテストと、テスト用 DB を使う統合テストに分ける |
| [0018](0018-locale-fallback.md) | 閲覧用 API は ?locale で言語を受け取り、翻訳がなければ ja で返す (0002 補足) |
| [0019](0019-compose-dev-environment.md) | 開発環境は docker compose up 1回で、DB・バックエンド・フロントエンドを立てる |
| [0020](0020-openapi-type-generation.md) | フロントエンドの API の型は、OpenAPI から自動で生成する (0014 補足) |

### Superseded / Deprecated(置き換え済み・廃止)

| 番号 | タイトル |
|------|----------|

