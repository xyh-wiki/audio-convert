# audio-convert | Online Audio & Video Converter (100% Browser)

Private, front-end only audio and video converter built with React, TypeScript, and Vite. All work happens inside your browser using FFmpeg.wasm - no uploads, no accounts.

## Features
- Audio <-> Audio, Video <-> Video, Video -> Audio extraction.
- Presets (High / Balanced / Small), bitrate + sample rate, mono/stereo, resolution + fps.
- Trim start/end, simple volume adjustment, queue with progress + cancel, download outputs.
- Supported targets: MP3, WAV, FLAC, AAC, OGG, M4A, OPUS, MP4, WebM, MOV, MKV (plus more in lists).
- SEO-ready single page with hero, how-it-works, supported formats, FAQ, and about.

## Getting started
```bash
pnpm install   # or npm install / yarn install
pnpm dev       # starts Vite dev server
pnpm build     # type-check + production build
pnpm preview   # serve built assets locally
```

## Project structure
- `src/App.tsx` - top-level layout and sections.
- `src/components/` - UI sections (hero, converter, FAQ, etc.).
- `src/hooks/useFfmpeg.ts` - lazy-loaded FFmpeg.wasm bridge for browser-side transcoding.
- `src/hooks/useConversionQueue.ts` - task queue, progress, cancel, retry.
- `src/services/i18n.tsx` - simple locale switcher (EN/zh placeholder).
- `src/utils/` - presets, options, ids.
- `index.html` - SEO meta tags, Open Graph/Twitter, JSON-LD.

## Usage notes
- First conversion triggers FFmpeg.wasm load (downloads the core from `unpkg.com`). Keep the tab active; large files may take time and memory.
- All processing stays in the browser. Temporary data is cleared when you close the tab.
- Format/codec success depends on your browser/hardware. MP4 (H.264 + AAC) and MP3/WAV are the most reliable outputs.
- For very large (1-2 GB+) videos, ensure sufficient free RAM and avoid heavy multitasking.

## Deployment
`pnpm build` outputs a static `dist/` directory suitable for any static host or CDN (Netlify, Vercel static, Cloudflare Pages, S3, etc.). FFmpeg.wasm bundles are fetched on-demand from public CDNs, so no custom server or headers are required.

### Custom FFmpeg core location
If you need to host your own FFmpeg core files, set `VITE_FFMPEG_BASE_URL` before running `pnpm build`. The app will try that base URL first, then fall back to unpkg/jsDelivr.

## Accessibility & SEO
- Semantic sections (header/main/footer), keyboard-friendly controls, high-contrast buttons.
- `<title>`, `<meta description>`, Open Graph/Twitter tags, and WebApplication JSON-LD are preconfigured in `index.html`.

## Limitations
- Browser-only processing means performance is tied to your CPU/GPU. There is no server fall-back.
- Some proprietary codecs (e.g., WMA/WMV) may fail depending on the FFmpeg build in WASM; fallback to MP4/MP3 where needed.
