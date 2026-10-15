# ADR 0011: ローカル開発では画像をローカルのファイルに置く

- **Date**: 2026-10-15
- **Status**: Accepted
- **Supplements**: [0008](0008-image-object-key.md)

## Context

[0008](0008-image-object-key.md) で、画像はストレージのオブジェクトキーで持ち、URL は API で組み立てると決めた。本番では S3 などのストレージサービスを使う。

ローカル開発では、クラウドのストレージに接続せずに画像のアップロードと表示を試したい。今のローカル環境は Docker Compose で DB だけを起動している。

## Decision

画像の保存は、バックエンドのストレージ用インターフェースを通して行う。実装を環境ごとに切り替える。

| 環境 | 保存先 | URL の組み立て |
|------|--------|----------------|
| ローカル | `backend/.storage/` 以下のファイル | Fastify で静的配信し、`http://localhost:<port>/storage/<key>` |
| 本番 | S3 など | CloudFront の URL、または署名付き URL |

DB に入るオブジェクトキーの形式(例: `projects/gcp-vector-search.png`)は、どちらの環境でも同じにする。切り替えは環境変数で行う。

```ts
interface ImageStorage {
  put(key: string, body: Buffer, contentType: string): Promise<void>
  delete(key: string): Promise<void>
  url(key: string): string
}
```

`backend/.storage/` は `.gitignore` に入れる。

### 検討した選択肢

| 案 | 内容 | 採否 |
|----|------|------|
| A | ローカルはファイルに置き、インターフェースで本番と切り替える | 採用 |
| B | S3 互換のエミュレーター(MinIO、LocalStack など)を Docker Compose で起動する | 不採用(コンテナが増える。ライセンスや配布形態の変更が続いているので、採用するなら最新の条件を確認する) |
| C | ローカルでも開発用の S3 バケットに接続する | 不採用(クラウドの認証情報が必要になり、オフラインで開発できない) |

## Consequences

- ローカル開発に追加のコンテナやクラウドの認証情報が要らない
- S3 固有の動作(署名付き URL、権限、CORS など)はローカルでは確認できない。本番相当の環境で確認する必要がある
- ストレージの実装が2つになる。インターフェースの外に S3 固有の処理を漏らさないようにする
