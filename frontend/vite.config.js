import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The dev server runs on 5173 and proxies /api -> the Node backend on 5000,
// so the React app and the API look like one origin during development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // bind all interfaces so both localhost and 127.0.0.1 work
    proxy: {
      "/api": "http://127.0.0.1:5000",
    },
  },
});
