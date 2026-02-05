import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import path from "path";
import { defineConfig, loadEnv, Plugin } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plugin para substituir variáveis no HTML
function htmlEnvPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'html-env',
    transformIndexHtml(html) {
      return html.replace(/%(\w+)%/g, (match, key) => {
        return env[key] || match;
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname), '');

  const plugins = [
    react(),
    tailwindcss(),
    vitePluginManusRuntime(),
    htmlEnvPlugin(env),
  ];

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    envDir: path.resolve(__dirname),
    root: path.resolve(__dirname, "client"),
    publicDir: path.resolve(__dirname, "client", "public"),
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      host: true,
      proxy: {
        '/api': 'http://localhost:3000',
        '/trpc': 'http://localhost:3000',
        '/uploads': 'http://localhost:3000',
      },
      allowedHosts: [
        "localhost",
        "127.0.0.1",
      ],
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
