# 部署与运维说明

版本：1.0（对应当前工作区代码）
目标环境：xyh-dep 的 Dokploy

## 部署模型

Dokploy 使用仓库根目录的 `Dockerfile` 构建镜像。构建阶段以 Node 22 执行 `npm ci` 和 `npm run build`；运行阶段使用 Caddy 2 在容器 3000 端口提供 `dist/`，并以镜像内创建的普通 `app` 用户运行。应用没有数据库、持久卷、迁移或秘密环境变量。

`xyh-dep` 的公网 `80/443` 由既有宿主机 Caddy 统一管理，负责 HTTPS 证书与域名路由；应用容器只监听 3000。不要新增另一个监听公网 `80/443` 的 Caddy。

## Dokploy 配置

- 构建方式：Dockerfile
- 容器端口：`3000`
- 域名：`audio-convert.xyh.wiki`
- 健康检查路径：`/healthz`
- 无需挂载卷或配置数据库

在 Dokploy 的 Advanced → Ports 中将应用发布为 `18083`（published port）、`host`（published port mode）、`3000`（target port）与 `tcp`（protocol）。宿主机防火墙必须仅允许回环流量访问 `18083`。然后在 `/data/configs/caddy/Caddyfile` 添加该域名的受管站点块，并反向代理到 `127.0.0.1:18083`；配置校验成功后执行 Caddy reload。该步骤会让 Caddy 为域名签发/加载证书。不要将 3000 或 18083 直接发布到公网。

## 验证与回滚

部署后确认 `https://audio-convert.xyh.wiki/healthz` 返回 `200` 与正文 `ok`，首页响应包含 COOP/COEP，且浏览器可以完成一次媒体转换。若失败，在 Dokploy 选择上一部署镜像回滚；如入口配置发生变更，应同时回滚对应 Caddy 路由。本应用不包含需恢复的数据。

## 资源与安全

服务端只提供静态文件，不处理用户媒体。FFmpeg 的 CPU 和内存消耗发生在访问者浏览器。镜像内不包含源码目录、`.ssh`、环境文件或构建缓存；依赖通过 `package-lock.json` 锁定。
