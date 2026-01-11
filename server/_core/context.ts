import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { jwtVerify } from "jose";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // First, try cookie-based session (JWT)
    const cookieHeader = opts.req.headers?.cookie as string | undefined;
    if (cookieHeader) {
      const match = cookieHeader
        .split(";")
        .map((s) => s.trim())
        .find((c) => c.startsWith("app_session_id="));
      if (match) {
        const token = match.split("=")[1];
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
  };
}



