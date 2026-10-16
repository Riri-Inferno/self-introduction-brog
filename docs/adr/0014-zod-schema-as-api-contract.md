# ADR 0014: API の入出力は Zod のスキーマで1回だけ定義し、検証・型・OpenAPI に使い回す

- **Date**: 2026-10-15
- **Status**: Proposed

## Context

API の入出力の形は、次の3か所で必要になる。

- リクエストの検証
- TypeScript の型
- OpenAPI の定義

それぞれを別々に書くと、どれか1つだけ直し忘れて食い違う。

## Decision

API の入出力は Zod のスキーマで1回だけ定義し、そこから検証、型、OpenAPI を作る。

| 用途 | 作り方 |
|------|--------|
| リクエストの検証 | `fastify-type-provider-zod` の `validatorCompiler` |
| レスポンスの検証と出力 | `fastify-type-provider-zod` の `serializerCompiler` |
| TypeScript の型 | 同ライブラリの型プロバイダーで、ルートの `request` と `reply` に型が付く |
| OpenAPI | `@fastify/swagger` に `jsonSchemaTransform` を渡して作る |

- スキーマは presentation 層に置く([0013](0013-backend-layered-architecture.md))。API の形は、domain のエンティティとは別に定義する
- レスポンスにもスキーマを付ける。スキーマにないフィールドは出力されないので、`isPublished` などの管理用の項目が閲覧用 API に漏れない
- 年月日だけの日付は `z.iso.date()` で `"YYYY-MM-DD"` の文字列にする([0006](0006-date-and-datetime.md))。OpenAPI では `format: date` になる
- OpenAPI の画面(`@fastify/swagger-ui`)は、本番以外で `/docs` に出す
- ルートには `public` か `admin` のタグを付ける([0012](0012-api-structure-and-admin-protection.md))

### 検討した選択肢

| 案 | 内容 | 採否 |
|----|------|------|
| A | Zod のスキーマから検証・型・OpenAPI を作る | 採用 |
| B | JSON Schema を手で書き、型は `json-schema-to-ts` などで作る | 不採用(Zod より書く量が多く、プロジェクトで Zod を使う方針とも合わない) |
| C | OpenAPI の定義を先に書き、コードを生成する | 不採用(生成の手順が増える。1人で開発するので、コードから定義を作るほうが速い) |

## Consequences

- スキーマを1か所直せば、検証、型、OpenAPI がそろって変わる
- レスポンスの検証の分だけ、出力が少し遅くなる。この規模では問題にならない
- フロントエンドから Zod のスキーマを使い回すかは、フロントエンドを作るときに決める
