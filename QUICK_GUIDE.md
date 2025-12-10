# 🚀 快速部署指南

## 30 秒快速开始

```bash
# 1. 本地验证（5分钟）
npm install && npm run build && npm run start:serve
# 访问 http://localhost:3000 测试转换功能

# 2. 提交更改
git add .
git commit -m "fix: FFmpeg deployment issues on Dokploy"
git push

# 3. Dokploy 部署
# - 在 Dokploy 中触发自动部署
# - 或手动部署新推送的代码
```

## ✅ 已修复的问题

- ✅ FFmpeg 资源在部署时被正确复制
- ✅ HTTP 头配置（COOP/COEP）确保 SharedArrayBuffer 可用
- ✅ MIME 类型正确设置（.wasm, .js）
- ✅ 路径加载支持多种环境
- ✅ Fallback 机制确保资源加载成功

## 📋 修改文件概览

### 核心修改
- `package.json` - build 脚本添加资源复制步骤
- `src/hooks/useFfmpeg.ts` - 改进 URL 加载逻辑
- `scripts/serve-with-headers.js` - 添加必要的 HTTP 头和 MIME 类型
- `vite.config.ts` - 优化 Vite 构建配置

-### 新增文件
- `scripts/copy-ffmpeg-assets.js` - 构建后脚本，复制 FFmpeg 资源
- `nixpacks.toml` - Nixpacks 构建配置
- `dokploy.json` - Dokploy 配置
- `DEPLOYMENT.md` - 详细部署指南
- `DEPLOYMENT_CHECKLIST.md` - 部署检查清单
- `FIX_SUMMARY.md` - 修复总结
- `QUICK_GUIDE.md` - 本文件

## 🔍 部署后验证

打开浏览器开发工具 (F12)，检查：

1. **Network 标签**
   - `/ffmpeg/esm/ffmpeg-core.js` → 200 OK
   - `/ffmpeg/esm/ffmpeg-core.wasm` → 200 OK
   - `/ffmpeg/esm/ffmpeg-core.worker.js` → 200 OK

2. **响应头**
   - 包含 `Cross-Origin-Opener-Policy: same-origin`
   - 包含 `Cross-Origin-Embedder-Policy: require-corp`
   - .wasm 文件的 `Content-Type: application/wasm`

3. **Console 标签**
   - 无 CORS 错误
   - FFmpeg 加载正常

4. **功能测试**
   - 上传音频文件
   - 选择目标格式
   - 执行转换
   - 应该成功完成并下载

## ⚠️ 常见问题

| 问题 | 解决方案 |
|-----|--------|
| WASM 返回 404 | 确保 `npm run build` 成功执行了 `copy-ffmpeg-assets.js` |
| 转换仍报错 | 检查浏览器 DevTools Network 标签中的 HTTP 头 |
| 缓存问题 | 清除浏览器缓存或使用隐私窗口重新测试 |
| 构建失败 | 查看 Dokploy 日志，确保 Node.js 版本兼容 |

## 📞 需要帮助？

详见以下文件获取完整信息：
- `DEPLOYMENT.md` - 完整的部署指南和故障排除
- `DEPLOYMENT_CHECKLIST.md` - 详细的检查清单
- `FIX_SUMMARY.md` - 修复方案的详细说明

---

**最后更新**：2025年12月10日
**适用版本**：1.0.0
