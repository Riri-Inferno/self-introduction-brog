# 開発用のイメージ(ADR 0019)。本番用は、デプロイ先を決めるときに別に作る
#
# ソースと node_modules は docker-compose.yml でマウントするので、ここではコピーしない
# 起動時の処理(npm install、Vite の開発サーバー)も docker-compose.yml の command に書く

FROM node:22-bookworm-slim

WORKDIR /app

EXPOSE 5173
