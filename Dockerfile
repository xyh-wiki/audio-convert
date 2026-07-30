FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./
RUN npm run build

FROM caddy:2.10-alpine

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /app/dist

# Dokploy 使用的上游镜像没有名为 `caddy` 的用户；创建明确的非特权账户，
# 并授予 Caddy 状态目录写权限，使服务无需 root 即可启动。
RUN addgroup -S app && adduser -S -D -H -G app app \
  && mkdir -p /config/caddy /data/caddy \
  && chown -R app:app /app /config /data

USER app
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/healthz || exit 1

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
