import React, { createContext, useContext, useMemo, useState } from "react";

type Locale = "en" | "zh";

const translations: Record<Locale, Record<string, string>> = {
  en: {
    tagline: "Online Audio & Video Converter - 100% Browser-Based",
    subTagline:
      "No uploads, no sign-up. Convert and extract audio & video entirely in your browser for privacy-sensitive work.",
    ctaStart: "Start Converting",
    ctaHow: "How it works",
    navConverter: "Converter",
    navHow: "How It Works",
    navFormats: "Supported Formats",
    navFAQ: "FAQ",
    navAbout: "About",
    dropTitle: "Drop files here or browse",
    dropHint: "All processing stays local - files never leave your browser.",
    queueTitle: "Conversion queue",
    presets: "Presets",
    advanced: "Advanced",
    start: "Convert",
    cancel: "Cancel",
    download: "Download",
    retry: "Retry",
    localOnly: "Local-only processing",
    trim: "Trim",
    volume: "Volume"
  },
  zh: {
    tagline: "纯前端音视频转换 —— 全程在浏览器完成",
    subTagline: "无需上传或注册，音视频转换与提取全部在本地浏览器执行，保护隐私。",
    ctaStart: "开始转换",
    ctaHow: "查看流程",
    navConverter: "转换器",
    navHow: "工作原理",
    navFormats: "支持格式",
    navFAQ: "常见问题",
    navAbout: "关于",
    dropTitle: "拖拽文件到此或点击选择",
    dropHint: "全部处理在本地进行，文件不会离开浏览器。",
    queueTitle: "任务队列",
    presets: "预设",
    advanced: "高级",
    start: "开始转换",
    cancel: "取消",
    download: "下载",
    retry: "重试",
    localOnly: "本地处理",
    trim: "裁剪",
    volume: "音量"
  }
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof typeof translations["en"]) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [locale, setLocale] = useState<Locale>("en");

  const t = useMemo(
    () => (key: keyof typeof translations["en"]) => translations[locale][key] ?? key,
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
