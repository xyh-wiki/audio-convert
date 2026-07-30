# 技术开发说明

版本：1.2（对应当前工作区代码）
维护规则：更改转换生命周期、工作区交互、FFmpeg 资源、配置或公开页面元数据时同步更新本文和 README。

## 架构与入口

应用采用 React 18、TypeScript 和 Vite 构建为静态单页应用。`src/main.tsx` 提供 React 根，`src/App.tsx` 提供覆盖完整视口的应用外壳。转换器 UI 位于 `src/components/ConverterPanel.tsx`：左侧是导入区与队列，中间只编辑选中的任务，右侧提供批次预设、下载操作和格式参考；媒体输入校验位于 `src/utils/media.ts`；队列生命周期位于 `src/hooks/useConversionQueue.ts`；FFmpeg.wasm 适配层位于 `src/hooks/useFfmpeg.ts`。

依赖方向为 `ConverterPanel → useConversionQueue → useFfmpeg`。UI 不直接调用 FFmpeg。队列拥有任务状态和下载 URL，FFmpeg hook 只负责加载、执行、进度与终止。`addTask` 返回任务 ID，供工作区在导入后选中首个新增任务；批次预设只调用现有任务更新接口，不改变任务顺序或运行中的参数。

## 任务与失败模型

任务以 `ConversionTask` 描述输入文件、模式、目标格式、选项和状态。队列通过 `activeId` 确保一次只有一个任务执行；`canceledTaskId` 阻止终止 FFmpeg 后的异步拒绝被误写为错误。输出 Blob URL 的所有权属于队列：移除、清空、重试及组件卸载时调用 `URL.revokeObjectURL`。

输入边界在 UI 前校验：最多 20 项、非空、最大 2 GB，且 MIME 或扩展名必须属于允许的音视频列表。这是浏览器内存保护，不代表服务端文件安全策略（本项目没有上传端点）。

## 构建与运行

`npm run build` 依次执行 TypeScript 检查、Vite 客户端构建、Vite SSR 构建与 `scripts/prerender.mjs` 首页预渲染，再把 `@ffmpeg/core` 的 ESM 资产复制到 `dist/ffmpeg/esm/`。`src/entry-server.tsx` 只在构建期调用 `renderToString`；浏览器检测到预渲染标记后使用 `hydrateRoot` 接管交互。`Dockerfile` 使用 Node 22 构建、Caddy 2 运行静态产物；镜像创建普通 `app` 用户，并在 3000 端口提供 COOP/COEP、安全响应头和 `/healthz`（正文为 `ok`）。`route` 块固定健康响应先于 SPA 回退执行。在 `xyh-dep`，宿主机 Caddy 负责公网 TLS，并通过仅本机发布的 Dokploy 端口转发给该容器。

## 测试映射

- TypeScript 构建覆盖组件接口和任务状态相关类型。
- ESLint 覆盖 React Hooks 和常见 JavaScript 问题。
- 需要浏览器冒烟：拖放和 `Ctrl/⌘ + O` 添加合法/非法文件、队列选择、修改单任务参数、批量预设、开始/取消/重试、单个与批量下载、清除完成项和清空队列，以及 FFmpeg 初次加载失败。

## SEO 与安全

生产域名预设为 `https://audio-convert.xyh.wiki/`，并已写入 canonical、Open Graph URL、`Audio Convert` 品牌分享图、favicon 与 WebApplication JSON-LD。页面使用系统字体，不在运行时加载第三方字体。首页由构建期 SSG 生成，初始 HTML 中包含工作区的唯一 H1、功能说明和语义化操作区；`index.html` 使用 `index, follow`，`robots.txt` 声明 sitemap，`sitemap.xml` 仅包含规范首页。发布后仍须验证渲染后 HTML、移动端、分享预览、断链和 Search Console 抓取状态。

媒体不会离开浏览器；应用不包含秘密或上传 API。FFmpeg 资源仅从已打包/本地路径加载，部署时应保留 COOP/COEP，并审核第三方依赖的许可证和安全更新。
