import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    host: "0.0.0.0",
    strictPort: false
  },
  build: {
    sourcemap: true,
    rollupOptions: isSsrBuild
      ? undefined
      : {
          output: {
            manualChunks: {
              vendor: ["react", "react-dom"]
            }
          }
        }
  },
  optimizeDeps: {
    include: ["@ffmpeg/ffmpeg", "@ffmpeg/core-mt"]
  }
}));
