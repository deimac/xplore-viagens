import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig, loadEnv, Plugin } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

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
  const env = loadEnv(mode, path.resolve(import.meta.dirname), '');

  const plugins = [
    react(),
    tailwindcss(),
    jsxLocPlugin(),
    vitePluginManusRuntime(),
    htmlEnvPlugin(env),
  ];

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    envDir: path.resolve(import.meta.dirname),
    root: path.resolve(import.meta.dirname, "client"),
    publicDir: path.resolve(import.meta.dirname, "client", "public"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
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
