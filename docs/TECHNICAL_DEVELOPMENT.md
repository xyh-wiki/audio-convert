# 技术开发说明

版本：1.4（对应当前工作区代码）
维护规则：更改转换生命周期、工作区交互、FFmpeg 资源、配置或公开页面元数据时同步更新本文和 README。

## 架构与入口

应用采用 React 18、TypeScript 和 Vite 构建为静态单页应用。`src/main.tsx` 提供 React 根，`src/App.tsx` 提供覆盖完整视口的应用外壳。转换器 UI 位于 `src/components/ConverterPanel.tsx`：左侧是导入区与队列，中间只编辑选中的任务，右侧提供批次预设、下载操作和格式参考；媒体输入校验位于 `src/utils/media.ts`；队列生命周期位于 `src/hooks/useConversionQueue.ts`；FFmpeg.wasm 适配层位于 `src/hooks/useFfmpeg.ts`。

依赖方向为 `ConverterPanel → useConversionQueue → useFfmpeg`。UI 不直接调用 FFmpeg。`src/utils/media.ts` 负责文件输入校验、输出文件名清理、预检提示和用户可行动失败建议。队列拥有任务状态、顺序和下载 URL，FFmpeg hook 只负责加载、执行、进度与终止。`addTask` 返回任务 ID，供工作区在导入后选中首个新增任务；批次预设和命名只调用现有任务更新接口。

## 任务与失败模型

任务以 `ConversionTask` 描述输入文件、模式、目标格式、输出基础名、选项和状态。队列通过 `activeId` 确保一次只有一个任务执行；`canceledTaskId` 阻止终止 FFmpeg 后的异步拒绝被误写为错误。只有 `idle`、`error` 和 `canceled` 状态允许调整队列顺序。输出 Blob URL 的所有权属于队列：移除、清空、重试及组件卸载时调用 `URL.revokeObjectURL`。

输入边界在 UI 前校验：最多 20 项、非空、最大 2 GB，且 MIME 或扩展名必须属于允许的音视频列表。这是浏览器内存保护，不代表服务端文件安全策略（本项目没有上传端点）。任务启动前还会检查剪辑区间；大文件、低设备内存、同格式输出与 GIF 输出仅作为用户可忽略的风险提示。默认预设和命名后缀经 `localStorage` 保存，内容不是秘密且不包含文件名、队列或转换结果。

## 构建与运行

`npm run build` 依次执行 TypeScript 检查、Vite 客户端构建、Vite SSR 构建与 `scripts/prerender.mjs` 首页预渲染，再把 `@ffmpeg/core` 的 ESM 资产复制到 `dist/ffmpeg/esm/`。`src/entry-server.tsx` 只在构建期调用 `renderToString`；浏览器检测到预渲染标记后使用 `hydrateRoot` 接管交互。`index.html` 在页面尾部加载同域 `/assistant/static/widget.js`，并以 `data-api-base="/assistant"`、`data-site="audio-convert"` 固定知识库；挂件不参与 React 生命周期，也不读取转换任务或文件。`Dockerfile` 使用 Node 22 构建、Caddy 2 运行静态产物；镜像创建普通 `app` 用户，并在容器 3000 端口提供 COOP/COEP、安全响应头和 `/healthz`（正文为 `ok`）。`Caddyfile` 必须在 SPA 回退前将 `/assistant/*` 去前缀代理至受控 Bot 上游，并为这类动态资源设置 `X-Robots-Tag: noindex, nofollow, noarchive`。Bot 端看到的是 `bot.xyh.wiki` Host，而浏览器 `Origin` 仍是 Audio Convert，因此第二层代理会固定 `Sec-Fetch-Site: cross-site`；Bot 仍以精确 Origin 白名单校验请求。COOP/COEP 不会阻断其资源，搜索引擎也不会将其当作公开正文。在 `miles-01`，Dokploy Traefik 是唯一公网入口，通过 Docker 网络将域名流量直接转发到该容器的 3000 端口；应用不再使用宿主机 Caddy、发布端口或端口守卫规则。Dokploy 管理面 `3000` 独立由 `DOCKER-USER` 持久规则限制为本机访问。

## 测试映射

- TypeScript 构建覆盖组件接口和任务状态相关类型。
- ESLint 覆盖 React Hooks 和常见 JavaScript 问题。
- 需要浏览器冒烟：拖放和 `Ctrl/⌘ + O` 添加合法/非法文件、队列选择、修改单任务参数、批量预设、开始/取消/重试、单个与批量下载、清除完成项和清空队列，以及 FFmpeg 初次加载失败。

## SEO 与安全

生产域名预设为 `https://audio-convert.xyh.wiki/`，并已写入 canonical、Open Graph URL、`Audio Convert` 品牌分享图、WebApplication JSON-LD 与多格式图标：`favicon-48.png` 是浏览器和搜索结果使用的主图标（符合 Google 的 48 像素倍数要求），`apple-touch-icon.png` 用于 iOS；SVG 标识仍供站点界面和分享资产复用。页面使用系统字体，不在运行时加载第三方字体。`index.html` 以 `defer` 加载自托管的 `https://umami.xyh.wiki/script.js`，并使用网站 ID `93a87f55-9c36-4b6d-acbf-408a4a00cd93` 统计访问；该跨源脚本以匿名 CORS 模式加载，以兼容生产环境的 COEP 响应头。网站 ID 不是认证秘密，但 Umami 服务端数据与访问权限必须由部署方保护，并按适用地区提供统计告知。首页由构建期 SSG 生成，初始 HTML 中包含工作区的唯一 H1、功能说明和语义化操作区；`index.html` 使用 `index, follow`，`robots.txt` 声明 sitemap，`sitemap.xml` 仅包含规范首页。发布后仍须验证渲染后 HTML、移动端、分享预览、断链和 Search Console 抓取状态。

媒体不会离开浏览器；应用不包含秘密或上传 API。FFmpeg 资源仅从已打包/本地路径加载，部署时应保留 COOP/COEP，并审核第三方依赖的许可证和安全更新。助手反向代理只能指向运维控制的 Bot 上游；其站点配置必须仅允许 `https://audio-convert.xyh.wiki`，知识文档不得包含用户上传媒体或密钥。输出文件名在下载前剥离路径和平台保留字符；转换失败仅向用户呈现通用原因与恢复建议，不回显 FFmpeg 内部参数或堆栈。
