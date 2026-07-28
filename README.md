# audio-convert | 浏览器端音视频转换器

私有、纯前端的音视频转换器，基于 React、TypeScript、Vite 和 FFmpeg.wasm。媒体只在浏览器中处理，不上传、不创建账户。

当前交付状态：可本地构建和运行，尚未部署；公开搜索收录默认关闭，原因见“SEO 与发布”。

## 已实现能力

- 音频转音频、视频转视频、视频提取音频。
- 高质量、均衡、小文件预设，以及码率、采样率、声道、分辨率、帧率、裁剪和音量控制。
- 串行转换队列、进度、当前任务取消、失败/取消重试与下载。
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
- `src/App.tsx` - top-level layout and sections.
- `src/components/` - UI sections (hero, converter, FAQ, etc.).
- `src/hooks/useFfmpeg.ts` - 从同源静态资源加载 FFmpeg.wasm，并执行浏览器端转换。
- `src/hooks/useConversionQueue.ts` - 串行任务队列、进度、取消、重试与内存释放。
- `src/utils/media.ts` - 输入校验、队列限制与文件大小显示。
- `src/services/i18n.tsx` - simple locale switcher (EN/zh placeholder).
- `src/utils/` - presets, options, ids.
- `index.html` - SEO meta tags, Open Graph/Twitter, JSON-LD.

## 使用说明

- 首次转换会从同源 `/ffmpeg/esm/` 加载 FFmpeg.wasm；请保持标签页处于活动状态，大文件会占用较多内存。
- 所有处理都在浏览器中完成，刷新或关闭页面会清除临时数据与下载结果。
- 编解码器兼容性取决于浏览器和硬件；MP4（H.264/AAC）及 MP3/WAV 的成功率通常最高。

## 构建与本地验证

```bash
pnpm install
pnpm lint
pnpm build
pnpm run start:serve
```

`npm run build` 会复制 FFmpeg ESM 核心到 `dist/ffmpeg/esm/`。生产运行由 `Dockerfile` 中的 Caddy 提供，包含 COOP、COEP、健康检查和静态资源缓存策略。

## Dokploy 部署

在 Dokploy 创建 Dockerfile 应用，仓库根目录为构建上下文，内部端口配置为 `3000`，域名配置为 `audio-convert.xyh.wiki`。应用无数据库、卷或迁移；回滚时在 Dokploy 切回上一镜像即可。不要额外启动宿主机 Caddy 占用 80/443，入口 HTTPS 应由 Dokploy 管理。

部署后至少检查：`/healthz` 返回 200、响应含 `Cross-Origin-Opener-Policy: same-origin` 与 `Cross-Origin-Embedder-Policy: require-corp`，以及一次实际的 FFmpeg 转换。

## SEO 与发布

正式域名预设为 `https://audio-convert.xyh.wiki/`，已用于 canonical、Open Graph 和结构化数据。公开正文仍为客户端渲染，因此还不是可安全收录的状态；`index.html` 和 `public/robots.txt` 继续强制 `noindex`。正式公开发布前，必须采用预渲染/SSG 输出公开正文、提供分享图片、生成仅含真实可收录 URL 的 sitemap，并完成移动端、渲染后 HTML 和分享预览检查后才移除 noindex。

## 文档

- [功能说明](docs/BUSINESS_SPEC.md)
- [技术开发说明](docs/TECHNICAL_DEVELOPMENT.md)
- [部署与运维说明](docs/OPERATIONS.md)

## Limitations
- Browser-only processing means performance is tied to your CPU/GPU. There is no server fall-back.
- Some proprietary codecs (e.g., WMA/WMV) may fail depending on the FFmpeg build in WASM; fallback to MP4/MP3 where needed.
