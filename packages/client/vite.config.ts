import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // El proxy hace que el cliente llame siempre a rutas relativas ("/api/...")
    // tanto en desarrollo como en produccion. Sin el, tendriamos que meter la
    // URL del backend en el codigo y cambiarla en cada despliegue.
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
