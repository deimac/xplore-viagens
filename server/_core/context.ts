import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User, Cliente } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { jwtVerify } from "jose";
import { CLIENT_COOKIE_NAME } from "@shared/const";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  cliente: Cliente | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let cliente: Cliente | null = null;

  try {
    // First, try cookie-based session (JWT)
    const cookieHeader = opts.req.headers?.cookie as string | undefined;
    if (!cookieHeader) {
      console.log('[Auth] createContext: no cookie header on request');
    } else {
      console.log('[Auth] createContext incoming cookie header:', cookieHeader);
    }
    if (cookieHeader) {
      // --- Admin session (app_session_id) ---
      const adminMatch = cookieHeader
        .split(";")
        .map((s) => s.trim())
        .find((c) => c.startsWith("app_session_id="));
      if (adminMatch) {
        const token = adminMatch.split("=")[1];
        try {
          const secret = new TextEncoder().encode(ENV.cookieSecret);
          const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
          const userId = (payload as any).id as number | undefined;
          if (userId) {
            const found = await db.getUserById(userId);
            if (found) {
              user = found as User;
            }
          }
        } catch (err) {
          // invalid token, fall through to other auth methods
        }
      }

      // --- Client session (client_session_id) ---
      const clientMatch = cookieHeader
        .split(";")
        .map((s) => s.trim())
        .find((c) => c.startsWith(CLIENT_COOKIE_NAME + "="));
      if (clientMatch) {
        const token = clientMatch.split("=")[1];
        try {
          const secret = new TextEncoder().encode(ENV.cookieSecret);
          const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
          const clienteId = (payload as any).clienteId as number | undefined;
          if (clienteId) {
            const found = await db.getClienteById(clienteId);
            if (found) {
              cliente = found as Cliente;
            }
          }
        } catch (err) {
          // invalid client token
        }
      }
    }

    // No dev header token support anymore; rely on cookie or SDK fallback

    // Fallback: existing Manus-based SDK authentication (if configured)
    if (!user) {
      try {
        user = await sdk.authenticateRequest(opts.req);
      } catch (err) {
        user = null;
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    cliente,
  };
}



