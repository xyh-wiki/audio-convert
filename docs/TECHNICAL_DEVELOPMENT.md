# 技术开发说明

版本：1.1（对应当前工作区代码）
维护规则：更改转换生命周期、FFmpeg 资源、配置或公开页面元数据时同步更新本文和 README。

## 架构与入口

应用采用 React 18、TypeScript 和 Vite 构建为静态单页应用。`src/main.tsx` 提供 React 根与国际化上下文，`src/App.tsx` 组合页面区域。转换器 UI 位于 `src/components/ConverterPanel.tsx`；媒体输入校验位于 `src/utils/media.ts`；队列生命周期位于 `src/hooks/useConversionQueue.ts`；FFmpeg.wasm 适配层位于 `src/hooks/useFfmpeg.ts`。

依赖方向为 `ConverterPanel → useConversionQueue → useFfmpeg`。UI 不直接调用 FFmpeg。队列拥有任务状态和下载 URL，FFmpeg hook 只负责加载、执行、进度与终止。

## 任务与失败模型

任务以 `ConversionTask` 描述输入文件、模式、目标格式、选项和状态。队列通过 `activeId` 确保一次只有一个任务执行；`canceledTaskId` 阻止终止 FFmpeg 后的异步拒绝被误写为错误。输出 Blob URL 的所有权属于队列：移除、清空、重试及组件卸载时调用 `URL.revokeObjectURL`。

输入边界在 UI 前校验：最多 20 项、非空、最大 2 GB，且 MIME 或扩展名必须属于允许的音视频列表。这是浏览器内存保护，不代表服务端文件安全策略（本项目没有上传端点）。

## 构建与运行

`npm run build` 依次执行 TypeScript 检查、Vite 生产构建，并把 `@ffmpeg/core` 的 ESM 资产复制到 `dist/ffmpeg/esm/`。`Dockerfile` 使用 Node 22 构建、Caddy 2 运行静态产物；Caddy 在 3000 端口提供 COOP/COEP、安全响应头和 `/healthz`。构建产物未在本任务中部署。

## 测试映射

- TypeScript 构建覆盖组件接口和任务状态相关类型。
- ESLint 覆盖 React Hooks 和常见 JavaScript 问题。
- 需要浏览器冒烟：添加合法/非法文件、开始/取消/重试、下载、清空队列，以及 FFmpeg 初次加载失败。

## SEO 与安全

生产域名预设为 `https://audio-convert.xyh.wiki/`，并已写入 canonical、Open Graph URL、分享图和 WebApplication JSON-LD。公开正文尚未预渲染，因此 `index.html` 和 `public/robots.txt` 继续明确 `noindex`，避免未验证的客户端页面进入索引。正式公开发布前必须：采用 SSG/预渲染使公开正文在初始 HTML 可见，生成只含真实路由的 sitemap，然后移除 noindex 并验证渲染后 HTML。

媒体不会离开浏览器；应用不包含秘密或上传 API。FFmpeg 资源仅从已打包/本地路径加载，部署时应保留 COOP/COEP，并审核第三方依赖的许可证和安全更新。
