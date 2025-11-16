// vite.config.mjs
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/selfMap/", // GitHub Pages 專案名稱
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 把大套件拆分
          react: ["react", "react-dom"],
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
          leaflet: ["leaflet"]
        }
      }
    },
    chunkSizeWarningLimit: 1000 // 把警告閾值提高到 1MB
  }
});
