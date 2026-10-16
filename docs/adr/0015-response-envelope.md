# ADR 0015: レスポンスの本文は、成功時は data、失敗時は error で包む形に統一する

- **Date**: 2026-10-15
- **Status**: Proposed

## Context

エンドポイントごとにレスポンスの形が違うと、フロントエンドで受け取る処理をエンドポイントごとに書くことになる。エラーの形がばらばらだと、表示する処理も共通にできない。

Fastify が自分で返すエラー(存在しないパス、JSON の構文エラーなど)も、そのままでは Fastify 独自の形になる。

## Decision

すべてのレスポンスの本文を、次の2つの形のどちらかにする。

成功時:

```json
{
  "data": { "name": "..." },
  "meta": { "total": 12 }
}
```

- `data` に結果を入れる。一覧のときは配列にする
- `meta` は、件数などの付加情報があるときだけ付ける
- 削除は 200 で `{ "data": null }` を返す。204(本文なし)は使わない

失敗時:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容に誤りがあります",
    "details": [{ "path": "translations.0.locale", "message": "..." }],
    "requestId": "req-1"
  }
}
```

- `code` はプログラムで判定するための固定の文字列にする。`message` は人が読むための説明で、変わることがある
- `details` は、どの項目が誤っているかを示すときだけ付ける
- `requestId` は Fastify がリクエストごとに振る ID。ログと突き合わせるために使う
- 500 では内部の情報(スタックトレース、SQL など)を返さない。詳細はログにだけ出す

`code` と HTTP ステータスの対応は次のとおりにする。

| code | ステータス | 主な場面 |
|------|-----------|----------|
| `VALIDATION_ERROR` | 400 | リクエストが Zod のスキーマに合わない。JSON の構文エラー |
| `UNAUTHORIZED` | 401 | 管理用 API で JWT がない、または無効([0012](0012-api-structure-and-admin-protection.md)) |
| `FORBIDDEN` | 403 | JWT は有効だが、許可していないメールアドレス |
| `NOT_FOUND` | 404 | データがない。存在しないパス |
| `CONFLICT` | 409 | 一意の値の重複(slug、スキル名など)。使われているカテゴリの削除 |
| `INTERNAL_ERROR` | 500 | 想定外のエラー |

### 変換する場所

- Fastify のエラーと、存在しないパスは、`setErrorHandler` と `setNotFoundHandler` でこの形にする
- DB の制約違反(一意制約、外部キー)は、infrastructure 層で domain のエラーに変換する。presentation 層は domain のエラーを `code` に変換する。Prisma のエラーコードを presentation 層で判定しない([0013](0013-backend-layered-architecture.md))
- 成功時の形も Zod のスキーマで定義する([0014](0014-zod-schema-as-api-contract.md))。`data` の中身だけを渡すと包んだスキーマを作る関数を用意し、ルートごとに包み方を書かない

### 検討した選択肢

| 案 | 内容 | 採否 |
|----|------|------|
| A | 成功は `{ data, meta? }`、失敗は `{ error }` で包む | 採用 |
| B | A に加えて、`{ "success": true, ... }` のように成否を示すフィールドを付ける | 不採用(HTTP ステータスと、`data` か `error` のどちらがあるかで判別できる) |
| C | 成功時は包まずに返し、失敗時だけ RFC 9457(Problem Details)の形にする | 不採用(成功時の形がエンドポイントごとに変わり、統一できない) |

## Consequences

- フロントエンドは、レスポンスを受け取る処理とエラーを表示する処理を、1つずつ書けば済む
- 本文が `data` の1段分深くなる
- 新しいエラーの種類を足すときは、この表に `code` を足す
