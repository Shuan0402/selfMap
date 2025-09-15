import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/selfMap/", // ⚠️ 這裡要改成 GitHub repo 名稱
});
