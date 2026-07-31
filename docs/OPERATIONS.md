# 部署与运维说明

版本：1.2（对应当前工作区代码）
目标环境：miles-01 的 Dokploy + Traefik

## 部署模型

Dokploy 使用仓库根目录的 `Dockerfile` 构建镜像。构建阶段以 Node 22 执行 `npm ci` 和 `npm run build`；运行阶段使用 Caddy 2 在容器 3000 端口提供 `dist/`，并以镜像内创建的普通 `app` 用户运行。应用没有数据库、持久卷、迁移或秘密环境变量。

`miles-01` 的 Dokploy Traefik 独占公网 `80/443`，负责 HTTPS 证书与域名路由；应用容器只监听 Docker 网络内的 3000。宿主机没有 Caddy；不要为应用另建公开端口或第二个入口代理。

## Dokploy 配置

- 构建方式：Dockerfile
- Traefik 目标端口：`3000`
- 域名：`audio-convert.xyh.wiki`
- 健康检查路径：`/healthz`
- 无需挂载卷或配置数据库

在 Dokploy 的 Domains 中添加 `audio-convert.xyh.wiki`，并将该路由指向应用容器端口 `3000`。不配置 Advanced → Ports 的 published port：Traefik 会通过 Dokploy 网络访问容器，且 `start-first` 可在新任务健康后再移除旧任务，不存在宿主机端口争抢。确认 Traefik 容器运行、域名 DNS 已指向 `miles-01` 后，Traefik 自动申请和续期证书。不要把应用 `3000` 直接发布到公网。

Dokploy 管理面监听主机 `3000`，但 Docker `DOCKER-USER` 持久规则仅允许回环访问。通过 `ssh -L 3000:127.0.0.1:3000 miles-01` 完成首次注册、GitHub 连接和项目配置；设置专用管理域名与认证前，不放开该端口。

## 验证与回滚

部署后确认 `https://audio-convert.xyh.wiki/healthz` 返回 `200` 与正文 `ok`，首页响应包含 COOP/COEP，且浏览器可以完成一次媒体转换。确认 `/assistant/static/widget.js` 返回 `200` 和 `X-Robots-Tag: noindex, nofollow, noarchive`，再在浏览器发送一次问答；该路径必须由应用容器 Caddy 同域代理到受控 Bot，不能为应用新增宿主机端口。每次发布同时确认新任务为 `healthy`、Traefik 容器运行且应用无 published port。若失败，在 Dokploy 选择上一镜像或上一部署回滚；如 DNS 已切换，保留或恢复原解析直至新入口通过验证。本应用不包含需恢复的数据。

## 资源与安全

服务端只提供静态文件，不处理用户媒体。FFmpeg 的 CPU 和内存消耗发生在访问者浏览器。镜像内不包含源码目录、`.ssh`、环境文件或构建缓存；依赖通过 `package-lock.json` 锁定。
