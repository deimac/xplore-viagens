import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { verifyJwt } from "./jwt"; // vamos criar isso já já

export async function authenticateRequest(
  req: Request
): Promise<User | null> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const payload = await verifyJwt(token);

    if (!payload?.userId) return null;

    //const user = await db.getUserById(payload.userId); verificar metodo correto
    const user = await db.getUserByOpenId(payload.userId);

    return user ?? null;
  } catch {
    return null;
  }
}
