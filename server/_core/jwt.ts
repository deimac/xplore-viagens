import jwt from "jsonwebtoken";
import { ENV } from "./env";

export type JwtPayload = {
  userId: string;
  email?: string;
  name?: string;
};

/**
 * Verifica e decodifica um JWT
 * Lança erro se inválido ou expirado
 */
export function verifyJwt(token: string): JwtPayload {
  if (!ENV.jwtSecret) {
    throw new Error("JWT_SECRET is required");
  }

  try {
    const decoded = jwt.verify(token, ENV.jwtSecret);

    if (typeof decoded === "string") {
      throw new Error("JWT payload inválido");
    }

    return decoded as JwtPayload;
  } catch (error) {
    throw new Error("Token inválido ou expirado");
  }
}

