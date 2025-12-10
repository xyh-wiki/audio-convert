# FFmpeg 部署问题修复清单

## 已实现的修复

### 1. 构建系统优化
- ✅ 更新 `package.json` - build 脚本现在包括 `copy-ffmpeg-assets.js`
- ✅ 创建 `scripts/copy-ffmpeg-assets.js` - 确保 FFmpeg 文件被复制到 dist
- ✅ 优化 `vite.config.ts` - 添加 optimizeDeps 配置

### 2. 服务器配置
- ✅ 更新 `scripts/serve-with-headers.js`:
  - 改用 Express 直接服务（替代 serve-handler）
  - 添加正确的 MIME 类型（.wasm, .js）
  - 实现 SPA 路由（HTML5 history API）
  - 配置长期缓存策略

### 3. 资源加载改进
- ✅ 重写 `src/hooks/useFfmpeg.ts`:
  - 修复 URL 计算逻辑（延迟到运行时）
  - 使用绝对 URL 确保跨域加载成功
  - 改进 fallback 机制（本地 -> unpkg -> jsdelivr）

### 4. Nixpacks 部署配置
- ✅ 添加 `nixpacks.toml` - 指示 Nixpacks 如何安装、构建和启动应用

### 5. 文档
- ✅ 更新 `DEPLOYMENT.md` - 完整的部署指南和故障排除

## 部署前的检查清单

### 代码提交
- [ ] 所有修改已提交到 Git
- [ ] 没有未提交的更改

### 本地验证
```bash
# 1. 清理构建
rm -rf dist node_modules

# 2. 重新安装依赖
npm install

# 3. 本地构建测试
npm run build

# 4. 验证 FFmpeg 文件是否被复制
ls -la dist/ffmpeg/esm/
# 应该包括: ffmpeg-core.js, ffmpeg-core.wasm, ffmpeg-core.worker.js

# 5. 本地启动
npm run start:serve

# 6. 访问 http://localhost:3000 并测试转换功能
```

### Dokploy 配置
- [ ] 仓库已连接到 Dokploy
- [ ] 选择正确的分支（main）
- [ ] 构建器设置为：Nixpacks（或在 `dokploy.json` 中设置 `"builder": "nixpacks"`）
- [ ] 构建命令：`npm run build`（已包含 FFmpeg 复制）
- [ ] 启动命令：`node scripts/serve-with-headers.js`
- [ ] 环境变量：`NODE_ENV=production`, `PORT=3000`

## 部署后的验证

### 1. 网络请求检查（浏览器开发工具）
打开 F12，切换到 Network 标签，刷新页面：

应该看到这些请求成功返回（状态码 200）：
```
GET /ffmpeg/esm/ffmpeg-core.js
GET /ffmpeg/esm/ffmpeg-core.wasm
GET /ffmpeg/esm/ffmpeg-core.worker.js
```

检查响应头：
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Content-Type: application/wasm (for .wasm files)
```

### 2. 浏览器控制台检查（F12 Console）
- [ ] 没有 CORS 错误
- [ ] FFmpeg 加载正常
- [ ] 应该看到 FFmpeg 加载成功的日志

### 3. 功能测试
- [ ] 选择一个音频文件（MP3/WAV/FLAC 等）
- [ ] 选择目标格式（例如 MP3 to WAV）
- [ ] 点击转换按钮
- [ ] 转换应该在浏览器中完成（进度条显示）
- [ ] 下载输出文件并验证格式正确

## 常见问题

### Q: 转换仍然失败
**A**: 检查以下几点：
1. Dokploy 日志中是否有错误
2. 运行 `npm run build` 是否成功执行 `copy-ffmpeg-assets.js`
3. 在构建产物中是否包含 `dist/ffmpeg/esm/` 目录（本地或通过 Dokploy 日志验证）

### Q: 无法下载文件
**A**: 检查浏览器是否支持 `Blob` 和 `URL.createObjectURL()`（所有现代浏览器都支持）

### Q: 页面无法加载
**A**: 检查 `serve-with-headers.js` 是否正确处理 SPA 路由

## 回滚方案

如果部署出问题，需要快速回滚：
1. 在 Dokploy 中切换到之前的提交
2. 重新部署

## 获取帮助

如果问题仍未解决：
1. 查看 Dokploy 的完整日志
2. SSH 进入容器检查文件系统
3. 查看 DEPLOYMENT.md 的故障排除部分
