# FFmpeg 部署问题修复总结

## 问题描述
部署到 Dokploy 后执行音频转换时报错：
```
FFmpeg 加载成功
```

本地开发环境正常，部署到 Dokploy 后出现此错误。

## 根本原因分析

1. **资源加载路径问题**：FFmpeg 核心文件（.wasm, .js）在不同环境中的路径解析不一致
2. **构建输出不完整**：FFmpeg 文件未被正确复制到 `dist/` 目录
3. **HTTP 头配置缺失**：缺少 COOP/COEP 头，导致 SharedArrayBuffer 无法使用
4. **MIME 类型不匹配**：.wasm 文件 MIME 类型不正确

## 实施的修复方案

### 1. 构建流程优化

#### 文件：`package.json`
```json
"build": "tsc && vite build && node scripts/copy-ffmpeg-assets.js"
```
- 添加了构建后脚本，确保 FFmpeg 资源被复制到 `dist/` 目录

#### 新增文件：`scripts/copy-ffmpeg-assets.js`
- 在构建完成后，自动将 `src/assets/ffmpeg/` 和 `public/ffmpeg/` 中的文件复制到 `dist/ffmpeg/`
- 支持递归复制，确保所有子目录和文件都被正确复制

### 2. 服务器配置改进

#### 文件：`scripts/serve-with-headers.js`
改进内容：
- **改用 Express 直接服务**：替代 serve-handler，获得更好的控制
- **添加 COOP/COEP 头**：
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Embedder-Policy: require-corp`
  - 这些头对 FFmpeg.wasm 使用 SharedArrayBuffer 是必需的
- **正确的 MIME 类型**：
  - `.wasm` → `application/wasm`
  - `.worker.js` → `application/javascript`
- **SPA 路由支持**：所有未匹配的路由返回 `index.html`
- **缓存策略**：
  - FFmpeg 文件：1 年缓存（不变）
  - HTML：no-cache（动态更新）

### 3. 资源加载逻辑改进

#### 文件：`src/hooks/useFfmpeg.ts`
改进内容：
- **`getAbsoluteUrl()` 函数**：确保所有资源 URL 都是绝对路径
  - 支持已是绝对 URL 的情况
  - 正确处理相对路径和 BASE_URL
- **`makeBase()` 函数**：改进路径构建逻辑
  - 更好地处理不同部署环境
- **`buildCoreSources()` 函数**：延迟执行 URL 计算
  - 避免模块加载时 window 对象不存在的问题
- **Fallback 机制**：
  1. 首先尝试本地 bundled 资源
  2. 其次尝试本地 `/ffmpeg/` 路径
  3. 最后尝试 CDN (unpkg, jsdelivr)

### 4. Vite 配置优化

#### 文件：`vite.config.ts`
改进内容：
- **`optimizeDeps`**：确保 @ffmpeg/ffmpeg 和 @ffmpeg/core 被正确预优化
- **构建输出配置**：优化 rollup 输出

### 5. Nixpacks 部署配置

#### 新增文件：`nixpacks.toml`
- 指示 Nixpacks 如何安装、构建和启动应用（替代 Dockerfile）

### 6. Dokploy 配置

#### 新增文件：`dokploy.json`
- Dokploy 友好的配置文件
- 指定构建命令、启动命令、端口等

#### 新增文件：`.dokploy/docker-compose.yml`
- Docker Compose 配置，用于 Dokploy 部署

### 7. 文档

#### 文件：`DEPLOYMENT.md`
- 完整的部署指南
- 问题原因分析
- 解决方案说明
- 部署步骤
- 验证方法
- 故障排除

#### 文件：`DEPLOYMENT_CHECKLIST.md`
- 部署前的检查清单
- 本地验证步骤
- Dokploy 配置指南
- 部署后的验证步骤

## 部署步骤

### 本地验证
```bash
# 1. 清理和重建
rm -rf dist node_modules
npm install

# 2. 本地构建
npm run build

# 3. 验证 FFmpeg 文件是否存在
ls -la dist/ffmpeg/esm/
# 应该包括：ffmpeg-core.js, ffmpeg-core.wasm, ffmpeg-core.worker.js

# 4. 启动本地服务器
npm run start:serve

# 5. 访问 http://localhost:3000 测试转换功能
```

### Dokploy 部署
1. 提交所有更改到 Git
2. 在 Dokploy 中配置：
  - 仓库：audio-convert
  - 分支：main
  - 构建器：Nixpacks（或在 `dokploy.json` 中设置 `"builder": "nixpacks"`）
  - 构建命令：`npm run build`
  - 启动命令：`node scripts/serve-with-headers.js`
  - 环境变量：`NODE_ENV=production`, `PORT=3000`
3. 触发部署
4. 等待部署完成，验证功能正常

## 验证部署成功

### 网络请求检查
打开浏览器开发工具 (F12)，切换到 Network 标签：
- `/ffmpeg/esm/ffmpeg-core.js` → 200
- `/ffmpeg/esm/ffmpeg-core.wasm` → 200
- `/ffmpeg/esm/ffmpeg-core.worker.js` → 200

检查响应头中是否包含：
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

### 功能测试
1. 上传一个音频文件
2. 选择目标格式
3. 点击转换
4. 应该看到进度条且无错误
5. 转换完成后下载文件

## 关键文件列表

| 文件 | 修改类型 | 说明 |
|-----|--------|------|
| `package.json` | 修改 | 更新 build 脚本 |
| `vite.config.ts` | 修改 | 添加优化配置 |
| `src/hooks/useFfmpeg.ts` | 修改 | 改进 URL 加载逻辑 |
| `scripts/serve-with-headers.js` | 修改 | 改用 Express，添加 HTTP 头 |
| `scripts/copy-ffmpeg-assets.js` | 新增 | 构建后脚本，复制 FFmpeg 资源 |
| `nixpacks.toml` | 新增 | Nixpacks 构建配置 |
| `dokploy.json` | 新增 | Dokploy 配置（已配置为使用 Nixpacks） |
| `DEPLOYMENT.md` | 新增 | 详细部署指南 |
| `DEPLOYMENT_CHECKLIST.md` | 新增 | 部署检查清单 |

## 故障排除

### 问题：转换仍然报错
**检查步骤**：
1. 查看 Dokploy 日志是否有构建错误
2. 在 Dokploy 控制台或容器 shell（如可用）中检查构建产物和运行日志
3. 验证构建产物：`ls -la dist/ffmpeg/esm/`（或检查 Dokploy 日志以确认 `copy-ffmpeg-assets.js` 已执行）
4. 查看浏览器开发工具的 Network 和 Console

### 问题：WASM 文件返回 404
**可能原因**：
- 构建脚本未执行
- FFmpeg 源文件不存在

**解决方案**：
1. 确保 `public/ffmpeg/` 目录包含源文件
2. 手动运行 `npm run build` 测试
3. 验证 `scripts/copy-ffmpeg-assets.js` 或构建步骤中是否正确复制了 FFmpeg 资源

### 问题：SharedArrayBuffer 相关错误
**原因**：缺少 COOP/COEP 头

**解决方案**：
1. 确认 `serve-with-headers.js` 在运行
2. 检查响应头是否包含 COOP/COEP
3. 重启容器

## 参考资源
- [FFmpeg.wasm 文档](https://ffmpegwasm.netlify.app/)
- [COOP/COEP 解释](https://web.dev/coop-coep/)
- [Dokploy 文档](https://dokploy.com/)
-- [Nixpacks 文档](https://nixpacks.com/)
