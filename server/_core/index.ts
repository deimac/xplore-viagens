import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
// import { registerOAuthRoutes } from "./oauth"; // removido
import { appRouter } from "../routers";
import { createContext } from "./context";
import { sdk } from "./sdk";
import { serveStatic, setupVite } from "./vite";
import path from "path";
import { ENV } from "./env";

const cookieSecret = process.env.COOKIE_SECRET;

if (!cookieSecret) {
  throw new Error("COOKIE_SECRET não definido");
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Body parser
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Servir arquivos estáticos de uploads
  const uploadsPath = path.join(process.cwd(), ENV.uploadsDir);
  app.use(`/${ENV.uploadsDir}`, express.static(uploadsPath));
  console.log(`📁 Serving static files from /${ENV.uploadsDir} -> ${uploadsPath}`);

  // OAuth (removido)
  // registerOAuthRoutes(app);

  // tRPC
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Dev = Vite | Prod = build estático
  // Server-side guard: redirect /admin HTML requests to login when no valid session
  app.use(async (req, res, next) => {
    try {
      const url = req.originalUrl || req.url || "";
      if (url.startsWith("/admin") && !url.startsWith("/api")) {
        const cookieHeader = req.headers.cookie as string | undefined;
        const cookies = cookieHeader || undefined;
        const parsed = (cookies || "");
        const match = parsed
          .split(";")
          .map((s) => s.trim())
          .find((c) => c.startsWith("app_session_id="));
        const token = match ? match.split("=")[1] : undefined;
        const session = await sdk.verifySession(token);
        if (!session) {
          // if it's the login page itself, allow
          if (url === "/admin/login") return next();
          return res.redirect("/admin/login");
        }
      }
    } catch (e) {
      // ignore errors and continue
    }
    return next();
  });

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // 🚨 PORTA OBRIGATÓRIA NO COOLIFY
  const port = Number(process.env.PORT);

  if (!port) {
    throw new Error("PORT environment variable is not defined");
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error("❌ Server failed to start:", err);
  process.exit(1);
});