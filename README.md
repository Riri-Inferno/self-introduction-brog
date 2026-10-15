<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
[![Issues][issues-shield]][issues-url]
[![License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
<h3 align="center">self-introduce</h3>

  <p align="center">
    経歴、スキル、個人開発などを公開する自己紹介サイトです。
    <br />
    <a href="#about-the-project"><strong>ドキュメントを読む »</strong></a>
    <br />
    <br />
    <a href="https://github.com/Riri-Inferno/self-introduce/issues/new">不具合を報告</a>
    &middot;
    <a href="https://github.com/Riri-Inferno/self-introduce/issues/new">機能を提案</a>
  </p>
</div>

> **状態: 開発中。** DB のスキーマとマイグレーションまでできています。API とフロントエンドは未実装です。「予定」と書いた部分は、未実装です。

<!-- TABLE OF CONTENTS -->
<details>
  <summary>目次</summary>
  <ol>
    <li>
      <a href="#about-the-project">このプロジェクトについて</a>
      <ul>
        <li><a href="#structure">構成</a></li>
        <li><a href="#api-policy">API の方針</a></li>
        <li><a href="#data-model">データモデル</a></li>
        <li><a href="#built-with">使う技術</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">はじめかた</a>
      <ul>
        <li><a href="#prerequisites">前提条件</a></li>
        <li><a href="#installation">導入手順</a></li>
      </ul>
    </li>
    <li><a href="#usage">使いかた</a></li>
    <li><a href="#roadmap">ロードマップ</a></li>
    <li><a href="#contributing">貢献のしかた</a></li>
    <li><a href="#license">ライセンス</a></li>
    <li><a href="#contact">連絡先</a></li>
    <li><a href="#acknowledgments">謝辞</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
<a id="about-the-project"></a>
## このプロジェクトについて

自己紹介サイトです。経歴、スキル、個人開発などを公開します。React、Fastify、Prisma、Zod を TypeScript で書く練習を兼ねています。

画面は2つあります。

- 閲覧画面: 一般ユーザーが見る自己紹介ページ
- 編集画面: 自分だけが使う。経歴などの内容を編集する

バックエンドは1つで、どちらの画面も同じ API を使います。

<a id="structure"></a>
### 構成

```
self-introduce/
├── backend/             API サーバー(Fastify + Prisma)
│   ├── prisma/          スキーマ(schema.prisma)とマイグレーション
│   ├── prisma.config.ts Prisma の設定
│   └── src/
├── frontend/            閲覧画面・編集画面(予定)
├── docs/
│   ├── adr/             設計判断の記録(ADR)
│   └── setup.md         セットアップの詳しい手順
├── docker-compose.yml   ローカル用の DB
└── README.md
```

<a id="api-policy"></a>
### API の方針

| パス | 用途 | 認証 | 操作 |
|------|------|------|------|
| `/api/public/*` | 閲覧用 | なし | 読み取りのみ。公開フラグが true のデータだけ返す |
| `/api/admin/*` | 管理用 | 必須 | 作成、更新、削除。全件を扱う |

- OpenAPI は public と admin のタグで区別します
- 管理用 API は、インフラの認証プロキシとアプリでの JWT 検証の両方で保護します(理由は [ADR 0012](docs/adr/0012-api-structure-and-admin-protection.md))

<a id="data-model"></a>
### データモデル

定義は [backend/prisma/schema.prisma](backend/prisma/schema.prisma) を参照してください。設計判断とその理由は、ADR として残しています(一覧は [docs/adr/README.md](docs/adr/README.md))。

<p align="right">(<a href="#readme-top">先頭へ戻る</a>)</p>

<a id="built-with"></a>
### 使う技術

* [![React][React-shield]][React-url]
* [![TypeScript][TypeScript-shield]][TypeScript-url]
* [![Fastify][Fastify-shield]][Fastify-url]
* [![Zod][Zod-shield]][Zod-url]
* [![Prisma][Prisma-shield]][Prisma-url]
* [![PostgreSQL][PostgreSQL-shield]][PostgreSQL-url]
* [![Docker][Docker-shield]][Docker-url]

| 領域 | 技術 |
|---|---|
| フロント | React, TypeScript |
| バックエンド | Fastify, TypeScript |
| バリデーション | Zod |
| ORM | Prisma 7 |
| DB | PostgreSQL 18 |
| ローカル環境 | Docker Compose(DB のみ) |

<p align="right">(<a href="#readme-top">先頭へ戻る</a>)</p>

<!-- GETTING STARTED -->
<a id="getting-started"></a>
## はじめかた

最短の手順です。各手順の説明、確認方法、困ったときの対処は [docs/setup.md](docs/setup.md) にあります。

<a id="prerequisites"></a>
### 前提条件

* Node.js 22 以上
* Docker
* Git

<a id="installation"></a>
### 導入手順

1. リポジトリを取得します。
   ```sh
   # 実行場所: 任意
   git clone https://github.com/Riri-Inferno/self-introduce.git
   ```
2. DB を起動します。
   ```sh
   # 実行場所: self-introduce/
   docker compose up -d
   ```
3. 環境変数を用意します。
   ```sh
   # 実行場所: self-introduce/backend
   cp .env.example .env
   ```
4. 依存を入れて、Prisma Client を生成します。
   ```sh
   # 実行場所: self-introduce/backend
   npm install
   npm run db:generate
   ```
5. マイグレーションを適用します。
   ```sh
   # 実行場所: self-introduce/backend
   npm run db:migrate
   ```

<p align="right">(<a href="#readme-top">先頭へ戻る</a>)</p>

<!-- USAGE EXAMPLES -->
<a id="usage"></a>
## 使いかた

> 今使えるのは、開発用のコマンドだけです。API サーバーの起動方法は、実装時に書きます。

```sh
# 実行場所: self-introduce/backend

# 型チェックをする
npm run typecheck

# schema.prisma から Prisma Client を生成する
npm run db:generate

# マイグレーションを作成・適用する
npm run db:migrate
```

schema.prisma を変えたときの手順は、[docs/setup.md の「スキーマを変えたとき」](docs/setup.md#スキーマを変えたとき)を参照してください。

<p align="right">(<a href="#readme-top">先頭へ戻る</a>)</p>

<!-- ROADMAP -->
<a id="roadmap"></a>
## ロードマップ

- [x] データモデルの設計(ADR 0001〜0011)
- [x] DB のマイグレーション(CHECK 制約を含む)
- [ ] API の実装
    - [ ] 閲覧用 API(`/api/public/*`)
    - [ ] 管理用 API(`/api/admin/*`)
- [ ] seed(初期データの投入)
- [ ] フロントエンドの実装
    - [ ] 閲覧画面
    - [ ] 編集画面
- [ ] インフラの認証と、管理用 API の JWT 検証(ADR 0012)

未実装の機能と既知の問題は、[Issues](https://github.com/Riri-Inferno/self-introduce/issues) にまとめます。

<p align="right">(<a href="#readme-top">先頭へ戻る</a>)</p>

<!-- CONTRIBUTING -->
<a id="contributing"></a>
## 貢献のしかた

提案や修正を歓迎します。

1. プロジェクトをフォークします。
2. 作業用のブランチを作ります。(`git checkout -b feature/<機能名>`)
3. 変更をコミットします。(`git commit -m '<変更の内容>'`)
4. ブランチをプッシュします。(`git push origin feature/<機能名>`)
5. プルリクエストを作ります。

設計を変えるときは、[docs/adr/](docs/adr/README.md) に ADR を追加してください。

<p align="right">(<a href="#readme-top">先頭へ戻る</a>)</p>

<!-- LICENSE -->
<a id="license"></a>
## ライセンス

未定です。決まり次第、`LICENSE` ファイルを追加します。

<p align="right">(<a href="#readme-top">先頭へ戻る</a>)</p>

<!-- CONTACT -->
<a id="contact"></a>
## 連絡先

`<名前>` - `<連絡先>`

プロジェクトの URL: [https://github.com/Riri-Inferno/self-introduce](https://github.com/Riri-Inferno/self-introduce)

<p align="right">(<a href="#readme-top">先頭へ戻る</a>)</p>

<!-- ACKNOWLEDGMENTS -->
<a id="acknowledgments"></a>
## 謝辞

* [Best-README-Template](https://github.com/othneildrew/Best-README-Template): この README の書式
* [yomiyasu](https://github.com/nanaism/yomiyasu): 日本語の文章を整えるスキル

<p align="right">(<a href="#readme-top">先頭へ戻る</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[issues-shield]: https://img.shields.io/github/issues/Riri-Inferno/self-introduce.svg?style=for-the-badge
[issues-url]: https://github.com/Riri-Inferno/self-introduce/issues
[license-shield]: https://img.shields.io/github/license/Riri-Inferno/self-introduce.svg?style=for-the-badge
[license-url]: https://github.com/Riri-Inferno/self-introduce/blob/main/LICENSE
[React-shield]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://react.dev/
[TypeScript-shield]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[Fastify-shield]: https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white
[Fastify-url]: https://fastify.dev/
[Zod-shield]: https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white
[Zod-url]: https://zod.dev/
[Prisma-shield]: https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white
[Prisma-url]: https://www.prisma.io/
[PostgreSQL-shield]: https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white
[PostgreSQL-url]: https://www.postgresql.org/
[Docker-shield]: https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white
[Docker-url]: https://www.docker.com/
