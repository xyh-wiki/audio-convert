# audio-convert | 浏览器端音视频转换器

私有、纯前端的音视频转换器，基于 React、TypeScript、Vite 和 FFmpeg.wasm。媒体只在浏览器中处理，不上传、不创建账户。

当前交付状态：已具备 `miles-01` Dokploy + Traefik 部署入口；首页在构建期预渲染，可供公开搜索收录。

## 已实现能力

- 音频转音频、视频转视频、视频提取音频。
- 高质量、均衡、小文件预设，以及码率、采样率、声道、分辨率、帧率、裁剪和音量控制。
- 串行转换队列、进度、当前任务取消、失败/取消重试与下载。
- 完整视口的转换工作区：拖放导入、队列选择、每个任务的参数编辑、批量预设、批量命名、批量下载和已完成任务清理。
- `Ctrl/⌘ + O` 快捷选择文件；转换设置始终以选中的单个任务为准，避免批量任务参数混淆。
- 转换前检查：大文件、低设备内存、无效剪辑区间、同格式输出和 GIF 体积风险会在开始前提示；无效剪辑会阻止任务启动。
- 单任务支持输出命名、片段截取、音量与响度标准化、分辨率、帧率、旋转、镜像和 GIF 输出；失败时显示可操作的格式或内存建议。
- 队列中可用上下箭头调整未开始任务的顺序；默认质量预设和批量命名后缀只保存在浏览器的 `localStorage`，不上传。
- 基础品牌资产：`Audio Convert` 名称、统一 SVG 标识、favicon 与分享图。
- 每队列最多 20 个文件、每文件最多 2 GB；在浏览器端拒绝空文件与不支持的媒体类型。
- MP3、WAV、FLAC、AAC、OGG、M4A、OPUS、MP4、WebM、MOV、MKV 等常用输出格式。

不提供云端保存、账户、服务端转换或 DRM 绕过；具体编解码器能否成功取决于 FFmpeg.wasm 构建和浏览器资源。

## 本地开发

```bash
npm ci
npm run dev
npm run build
```

## 项目结构

- `src/App.tsx` - 全视口应用外壳。
- `src/components/ConverterPanel.tsx` - 三栏转换工作区、队列操作和单任务编辑器。
- `src/components/Header.tsx`、`Footer.tsx` - 应用导航和按需使用说明。
- `public/logo-mark.svg`、`favicon.svg`、`favicon-48.png`、`apple-touch-icon.png`、`og-image.svg` - 站点标识、浏览器与搜索结果图标、移动端图标及分享图。
- `src/hooks/useFfmpeg.ts` - 从同源静态资源加载 FFmpeg.wasm，并执行浏览器端转换。
- `src/hooks/useConversionQueue.ts` - 串行任务队列、进度、取消、重试与内存释放。
- `src/utils/media.ts` - 输入校验、队列限制与文件大小显示。
- `src/utils/` - presets, options, ids.
- `index.html` - SEO meta tags, Open Graph/Twitter, JSON-LD.

## 使用说明

- 首次转换会从同源 `/ffmpeg/esm/` 加载 FFmpeg.wasm；请保持标签页处于活动状态，大文件会占用较多内存。
- 所有处理都在浏览器中完成，刷新或关闭页面会清除临时数据与下载结果。
- 编解码器兼容性取决于浏览器和硬件；MP4（H.264/AAC）及 MP3/WAV 的成功率通常最高。
- 点击队列项目后可编辑输出名称、格式、质量预设和高级参数；已开始或排队中的任务会锁定参数，避免转换过程发生变化。
- “批次操作”只会更新尚未开始、失败或已取消的任务；“下载全部”会触发所有已完成结果的浏览器下载。
- GIF 不含音频，且通常比短视频更大；建议先用起始/结束时间截取片段。浏览器可能要求允许“下载全部”触发多个下载。

## 构建与本地验证

```bash
pnpm install
pnpm lint
pnpm build
pnpm run start:serve
```

`npm run build` 会复制 FFmpeg ESM 核心到 `dist/ffmpeg/esm/`。生产运行由 `Dockerfile` 中的 Caddy 提供，包含 COOP、COEP、健康检查和静态资源缓存策略。

## Dokploy 部署

在 `miles-01` 的 Dokploy 创建 Dockerfile 应用，仓库根目录为构建上下文，容器目标端口为 `3000`，域名配置为 `audio-convert.xyh.wiki`。应用无数据库、卷或迁移；回滚时在 Dokploy 切回上一镜像即可。

`miles-01` 的 Dokploy Traefik 是唯一公网 `80/443` 入口，并负责应用域名路由与 TLS 证书。不要在 Advanced → Ports 创建 `3000` 的 published port，也不要新增宿主机 Caddy；Traefik 会通过 Dokploy 网络直接转发到容器端口 `3000`。应用继续使用 `Dockerfile` 内的 Caddy 仅提供容器内部静态资源和 `/healthz`，它不监听宿主机公网端口。

Dokploy 管理面默认仅允许本机访问 `3000`。首次配置或无管理域名时，通过 SSH 隧道访问：

```bash
ssh -L 3000:127.0.0.1:3000 miles-01
```

然后在浏览器打开 `http://127.0.0.1:3000`。完成应用部署并确认 Traefik 健康后，再由维护者将 Cloudflare 的 `audio-convert.xyh.wiki` DNS 解析切换到 `miles-01`。

部署后至少检查：`/healthz` 返回 `200` 与正文 `ok`、首页响应含 `Cross-Origin-Opener-Policy: same-origin` 与 `Cross-Origin-Embedder-Policy: require-corp`，以及一次实际的 FFmpeg 转换。

## SEO 与发布

正式域名为 `https://audio-convert.xyh.wiki/`，已用于 canonical、Open Graph、结构化数据和 sitemap。`npm run build` 会预渲染首页工作区，`index.html` 初始 HTML 已包含可读正文、唯一 H1 和主要功能说明；`public/robots.txt` 允许抓取，`public/sitemap.xml` 只包含首页。发布后仍需检查移动端、渲染后 HTML、分享预览、断链和 Search Console 的实际抓取状态。

## 文档

- [功能说明](docs/BUSINESS_SPEC.md)
- [技术开发说明](docs/TECHNICAL_DEVELOPMENT.md)
- [部署与运维说明](docs/OPERATIONS.md)

## Limitations
- Browser-only processing means performance is tied to your CPU/GPU. There is no server fall-back.
- Some proprietary codecs (e.g., WMA/WMV) may fail depending on the FFmpeg build in WASM; fallback to MP4/MP3 where needed.
