import React from "react";

export const Footer: React.FC = () => (
  <footer id="guide" className="app-footer">
    <div>
      <strong>文件不会上传</strong>
      <p>转换在当前浏览器标签页中执行。关闭或刷新页面会清除队列和下载结果。</p>
    </div>
    <div>
      <strong>使用提示</strong>
      <p>首次转换需要加载 FFmpeg。大文件会占用较多内存，请保持页面处于活动状态。</p>
    </div>
    <div className="footer-meta">© {new Date().getFullYear()} Audio Convert</div>
  </footer>
);
