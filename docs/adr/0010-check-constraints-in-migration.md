# ADR 0010: CHECK 制約はマイグレーション SQL に手で追記する

- **Date**: 2026-10-15
- **Status**: Accepted

## Context

入力値の検証は管理用 API の Zod で行う。しかし、Zod の検証は API を通ったときにしか効かない。seed スクリプトや手作業の SQL、将来のバグのあるコードから入ったデータは検証されない。

一方、Prisma の schema には CHECK 制約の書き方がない。schema で表現できない機能は、`--create-only` で作ったマイグレーション SQL を編集して入れる方法が Prisma の標準である。

## Decision

次の CHECK 制約を、最初のマイグレーション SQL に手で追記する。

| 対象 | 条件 | 防ぎたいこと |
|------|------|--------------|
| `Profile.id` | `id = 1` | プロフィールが2行以上できること |
| 各翻訳テーブルの `locale` | `'ja'` か `'en'` のどちらか | 想定外の言語コードが入ること |
| `startedAt` / `endedAt` を持つテーブル | `endedAt` が NULL か、`startedAt` 以降 | 終了日が開始日より前になること |

手順は次のとおり。

1. `prisma migrate dev --create-only` でマイグレーション SQL を作る(DB には適用しない)
2. 作られた SQL の末尾に `ALTER TABLE ... ADD CONSTRAINT ... CHECK (...)` を追記する
3. `prisma migrate dev` で DB に適用する

## Consequences

- どの経路から書き込んでも、DB が条件に合わない値を拒否する
- CHECK 制約は schema.prisma に現れないので、schema だけを読んでも制約が分からない。この ADR とマイグレーション SQL を見る必要がある
- 手で書くのは制約を追加するときの1回だけ。以降は `migrate dev` / `migrate deploy` がどの環境にも自動で適用する
- Prisma は schema にない CHECK 制約を差分として扱わないので、次のマイグレーションを作るときに制約が消されることはない
- 言語を増やすときは、`locale` の CHECK 制約を変更するマイグレーションが要る
- 制約の入れ忘れを統合テスト(例: `locale = 'jp'` の INSERT がエラーになること)で確かめるかは、マイグレーション手順を作るときに決める
