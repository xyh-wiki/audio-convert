import React from "react";

export const Header: React.FC = () => (
    <header className="app-header">
      <a className="brand" href="#converter" aria-label="音视频转换工作区">
        <span className="brand-mark"><img src="/logo-mark.svg" alt="" /></span>
        <span>
          <strong>Audio Convert</strong>
          <small>浏览器内音视频转换</small>
        </span>
      </a>
      <div className="header-actions">
        <a className="header-link" href="#guide">使用说明</a>
      </div>
    </header>
  );
