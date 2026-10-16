# ADR 0013: バックエンドはクリーンアーキテクチャに沿って層を分け、依存は外から渡す

- **Date**: 2026-10-15
- **Status**: Accepted

## Context

これから API を実装する。ルートに Prisma の呼び出しを直接書くと、次の問題が起きる。

- DB がないとテストできない。ルートの処理を確かめるたびに、DB の準備とデータの投入が要る
- HTTP の都合(リクエストの形)、業務のルール(公開の判定など)、DB の都合(翻訳テーブルの結合)が1か所に混ざる
- Prisma や Fastify を差し替えたり、バージョンを上げたりするときに、影響が全体に広がる

テストしやすく、関心ごとに分かれた構成にしたい。

## Decision

### 層の分け方

クリーンアーキテクチャに沿って、`backend/src/` を次の層に分ける。

```
backend/src/
├── domain/          エンティティ、値オブジェクト、リポジトリのインターフェース
├── application/     ユースケース。domain のインターフェースだけを使う
├── infrastructure/  Prisma のリポジトリ、画像ストレージ、設定の読み込み
├── presentation/    Fastify のルート、Zod のスキーマ、レスポンスの形、エラーの変換
├── app.ts           buildApp(deps): Fastify を組み立てる。依存は引数で受け取る
└── main.ts          起動処理。設定を読み、実装を組み立てて buildApp に渡す
```

依存の向きは次のとおりにする。内側の層は外側の層を知らない。

```
presentation → application → domain ← infrastructure
```

- domain は Prisma、Fastify、Zod に依存しない。Prisma が生成する型も domain には持ち込まない
- application はリポジトリなどのインターフェースを domain から使う。実装(Prisma)は知らない
- infrastructure は domain のインターフェースを実装する。Prisma の型と domain の型の変換はここで行う
- presentation は HTTP の入出力だけを扱う。業務のルールは書かない

### 依存は外から渡す

実装の組み立ては `main.ts` の1か所で行い、各層には関数の引数かコンストラクタで渡す。DI コンテナのライブラリは使わない。

テストでは、`buildApp` やユースケースに、DB を使わないフェイクの実装を渡す。

### 書き込みと読み取りで経路を分ける

- 書き込み: リポジトリが集約単位で保存する([0007](0007-updated-at-propagation.md) の保存関数はここに置く)
- 読み取り: 画面に返す形のデータを直接返すクエリ用のインターフェースを application に定義し、infrastructure で実装する。閲覧用 API の一覧などで、エンティティを組み立ててから詰め替える手間を省くため

公開の判定([0005](0005-publish-flag.md))は、読み取り用インターフェースの約束事として定義し、Prisma の実装でクエリの条件にする。

### 検討した選択肢

| 案 | 内容 | 採否 |
|----|------|------|
| A | クリーンアーキテクチャの4層。依存は main.ts で組み立てて渡す | 採用 |
| B | routes / services / repositories の3層。各層が下の層の実装を直接 import する | 不採用(実装を差し替えられず、テストで DB が要る) |
| C | ルートに Prisma の呼び出しを直接書く | 不採用(テストに DB が要り、関心ごとが混ざる) |
| D | A に加えて DI コンテナ(tsyringe、awilix など)を使う | 不採用(この規模では main.ts で組み立てれば足りる) |

## Consequences

- ユースケースとルートを、DB なしでテストできる
- Prisma の型と domain の型の変換を書く手間が増える
- 小さな処理でも複数の層にファイルが分かれる。読み取りの経路を分けて、詰め替えを最小限にする
- Prisma の生成物を import してよいのは infrastructure だけになる
