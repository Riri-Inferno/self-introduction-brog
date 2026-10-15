# ADR 0005: 公開・下書きは isPublished で表し、親が非公開なら子も出さない

- **Date**: 2026-10-15
- **Status**: Accepted

## Context

編集画面では、書きかけの内容を下書きとして保存したい。公開用 API(`/api/public/*`)は公開済みのデータだけを返し、管理用 API(`/api/admin/*`)は全件を扱う。

経歴と案件のように親子関係があるモデルでは、親と子の公開フラグが食い違う場合がある。例えば、経歴は非公開なのに配下の案件だけが公開になっている状態である。

## Decision

### 下書きは isPublished で表す

`isPublished = false` を下書きとする。初期値は `false` にして、明示的に公開しない限り外に出ないようにする。公開用 API では除外する。

`isPublished` を持つのは `Career`、`Assignment`、`Project`、`Education`、`Certification`、`SocialLink`、`Post`。

### 親が非公開なら子も公開しない

親子関係のあるモデルは、親も公開のときだけ子を公開扱いにする。公開用 API のクエリでは、親の `isPublished` も条件に入れる。

```ts
prisma.assignment.findMany({
  where: { isPublished: true, career: { isPublished: true } },
})
```

### スキルは常に公開する

`Skill` は `isPublished` を持たない。登録したものはスキル一覧に全件出す。登録したということは出したいもの、という考え方による。

案件・個人開発に付く技術タグは、その案件・個人開発が公開のときだけ表示される。

## Consequences

- 公開用 API の実装では、親の公開フラグの条件を付け忘れないようにする必要がある
- スキルを一覧から隠したいときは削除するしかない。必要になったら `isPublished` を足す
- 案件が1件も公開されていない経歴でも、経歴自体が公開なら表示される
