import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/users': {
        target: 'https://glossiest-junko-tangential.ngrok-free.dev',
        changeOrigin: true,
      },
      '/admin': {
        target: 'https://glossiest-junko-tangential.ngrok-free.dev',
        changeOrigin: true,
      },
      '/entities': {
        target: 'https://glossiest-junko-tangential.ngrok-free.dev',
        changeOrigin: true,
      },
      '/crypto': {
        target: 'https://glossiest-junko-tangential.ngrok-free.dev',
        changeOrigin: true,
      },
      '/fiat': {
        target: 'https://glossiest-junko-tangential.ngrok-free.dev',
        changeOrigin: true,
      },
      '/assets': {
        target: 'https://glossiest-junko-tangential.ngrok-free.dev',
        changeOrigin: true,
      },
      '/transactions': {
        target: 'https://glossiest-junko-tangential.ngrok-free.dev',
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
