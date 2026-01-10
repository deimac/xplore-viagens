import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
// import { registerOAuthRoutes } from "./oauth"; // removido
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

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