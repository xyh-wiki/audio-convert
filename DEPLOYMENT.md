# Dokploy 部署指南

## 问题及解决方案

### 问题描述
部署到 Dokploy 后执行转换操作时报错：
```
FFmpeg: Unable to load FFmpeg core. Check network or local /ffmpeg assets.
```

### 根本原因
1. FFmpeg 核心文件（`.wasm`, `.js`, `.worker.js`）在部署环境中路径加载不正确
2. 构建输出未包含所有必需的 FFmpeg 资源文件
3. MIME 类型配置不当导致资源加载失败

### 解决方案

#### 1. 确保 FFmpeg 资源被正确复制
已实现以下改进：
- **构建后脚本**：`scripts/copy-ffmpeg-assets.js` 确保 FFmpeg 文件被复制到 `dist/ffmpeg/`
- **Dockerfile**：多阶段构建，确保 FFmpeg 资源包含在最终镜像中
- **构建命令更新**：`package.json` 中的 build 脚本现在包含资源复制步骤
 - **构建后脚本**：`scripts/copy-ffmpeg-assets.js` 确保 FFmpeg 文件被复制到 `dist/ffmpeg/`
 - **Nixpacks 配置**：已添加 `nixpacks.toml`，用于在 Dokploy 等环境中使用 Nixpacks 构建
 - **构建命令更新**：`package.json` 中的 build 脚本现在包含资源复制步骤

#### 2. 改进资源加载路径
在 `src/hooks/useFfmpeg.ts` 中实现了：
- `getAbsoluteUrl()` 函数确保加载的是完整的绝对 URL
- 改进的路径解析逻辑，适配不同部署环境
- 更稳健的 fallback 机制（本地 -> unpkg -> jsdelivr）

#### 3. 正确的 HTTP 头配置
在 `scripts/serve-with-headers.js` 中配置：
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`
- 正确的 MIME 类型：`.wasm` → `application/wasm`
- 长期缓存策略：FFmpeg 资源 1 年缓存

#### 4. Vite 构建配置优化
在 `vite.config.ts` 中添加了：
- 更好的 rollup 输出配置
- 资源别名处理

## 部署步骤

### 本地构建测试
```bash
npm run build
npm run start:serve
```
访问 `http://localhost:3000` 测试转换功能。

### Dokploy 部署
1. **提交更改**到 Git 仓库
2. **在 Dokploy 中配置**：
   - 使用 Nixpacks 构建（在 `dokploy.json` 中设置 `"builder": "nixpacks"` 或在控制台选择 Nixpacks）
   - 环境变量：`NODE_ENV=production`
   - 构建命令：`npm run build`（已包含资源复制）
   - 启动命令：`node scripts/serve-with-headers.js`

### 部署检查清单
 - [ ] `nixpacks.toml` 已存在于项目根目录（用于 Nixpacks 构建）
 - [ ] `package.json` build 脚本包含 `copy-ffmpeg-assets.js`
- [ ] `package.json` build 脚本包含 `copy-ffmpeg-assets.js`
- [ ] FFmpeg 文件存在于 `public/ffmpeg/` 或 `src/assets/ffmpeg/`
- [ ] 所有代码变更已提交到 Git

## 验证部署

部署完成后，检查以下项：

1. **网络请求**：打开浏览器开发工具，查看 Network 标签
   - `/ffmpeg/esm/ffmpeg-core.js` 应该返回 200
   - `/ffmpeg/esm/ffmpeg-core.wasm` 应该返回 200
   - `/ffmpeg/esm/ffmpeg-core.worker.js` 应该返回 200

2. **浏览器控制台**：检查 Console 标签
   - 应该看到 FFmpeg 加载成功的日志
   - 不应该有跨域错误 (CORS errors)

3. **功能测试**：
   - 选择音频文件并尝试转换
   - 转换应该在浏览器端完成（无上传）

## 故障排除

### 问题：FFmpeg 仍然无法加载
**解决方案**：
1. 检查 Dokploy 日志中是否有构建错误
2. 如果需要在运行环境检查构建产物（没有容器访问权限时，请使用 Dokploy 控制台日志）：
   - 在本地运行：
     ```bash
     npm run build
     ls -la dist/ffmpeg/esm/
     ```
   - 在 Dokploy 上，检查构建日志和运行时日志，确认 `dist/ffmpeg/esm/` 已被复制并且服务器启动无误。
3. 检查 HTTP 响应头是否包含正确的 COOP/COEP 标头

### 问题：WASM 文件返回 404
**原因**：FFmpeg 文件未被复制到 dist 目录
**解决方案**：
1. 确保构建脚本实际执行了：
   ```bash
   node scripts/copy-ffmpeg-assets.js
   ```
2. 检查 `public/ffmpeg/esm/ffmpeg-core.wasm` 文件是否存在

### 问题：转换失败但无明确错误
**可能原因**：缺少 COOP/COEP 头
**解决方案**：
1. 确认 `serve-with-headers.js` 正在运行
2. 在浏览器开发工具中检查响应头

## 参考资源
- [FFmpeg.wasm 文档](https://ffmpegwasm.netlify.app/)
- [COOP/COEP 说明](https://web.dev/coop-coep/)
- [Dokploy 文档](https://dokploy.com/)
