# 開発用のイメージ(ADR 0019)。本番用は、デプロイ先を決めるときに別に作る
#
# ソースと node_modules は docker-compose.yml でマウントするので、ここではコピーしない
# 起動時の処理(npm install、マイグレーション、tsx watch)も docker-compose.yml の command に書く

FROM node:22-bookworm-slim

# Prisma の CLI(マイグレーション)が OpenSSL を使う
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

EXPOSE 3000
