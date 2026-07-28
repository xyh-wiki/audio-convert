# 部署与运维说明

版本：1.0（对应当前工作区代码）
目标环境：xyh-dep 的 Dokploy

## 部署模型

Dokploy 使用仓库根目录的 `Dockerfile` 构建镜像。构建阶段以 Node 22 执行 `npm ci` 和 `npm run build`；运行阶段使用 Caddy 2 在容器 3000 端口提供 `dist/`。应用没有数据库、持久卷、迁移或秘密环境变量。

Dokploy 负责公网 HTTPS 和域名路由；应用容器只监听内部端口 3000。不要同时部署宿主机 Caddy 以监听相同公网端口。

## Dokploy 配置

- 构建方式：Dockerfile
- 内部端口：`3000`
- 域名：`audio-convert.xyh.wiki`
- 健康检查路径：`/healthz`
- 无需挂载卷或配置数据库

## 验证与回滚

部署后确认 `/healthz` 返回 200，首页响应包含 COOP/COEP，且浏览器可以完成一次媒体转换。若失败，在 Dokploy 选择上一部署镜像回滚；本应用不包含需恢复的数据。

## 资源与安全

服务端只提供静态文件，不处理用户媒体。FFmpeg 的 CPU 和内存消耗发生在访问者浏览器。镜像内不包含源码目录、`.ssh`、环境文件或构建缓存；依赖通过 `package-lock.json` 锁定。
