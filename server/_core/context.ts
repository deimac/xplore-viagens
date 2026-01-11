import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { ENV } from "./env";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Allow a development admin token via header `x-admin-token` for local testing.
  try {
    const adminToken = (opts.req.headers["x-admin-token"] as string) || (opts.req.headers["X-Admin-Token"] as string);
    if (adminToken && adminToken === ENV.adminToken) {
      // synthetic admin user for dev purposes
      user = {
        id: -1,
        openId: "admin",
        name: "Admin",
        email: ENV.adminEmail || "admin@localhost",
        passwordHash: "",
        loginMethod: "admin",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      } as unknown as User;
    } else {
      user = await sdk.authenticateRequest(opts.req);
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



