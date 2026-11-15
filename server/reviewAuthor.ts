// Autor de avaliação verificado (Google/Facebook): vai num cookie assinado (HS256, COOKIE_SECRET).
// reviews.create só aceita o autor que está nesse cookie.
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./_core/env";

export const REVIEW_AUTHOR_COOKIE = "review_author";
export const REVIEW_AUTHOR_MAX_AGE_S = 60 * 60;

export interface ReviewAuthorClaims {
  provider: "google" | "facebook";
  providerId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  /** Só no modo MySQL (legado). */
  authorId?: number;
}

const secret = () => new TextEncoder().encode(ENV.cookieSecret);

export async function signReviewAuthor(a: ReviewAuthorClaims): Promise<string> {
  return new SignJWT({ ...a })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${REVIEW_AUTHOR_MAX_AGE_S}s`)
    .sign(secret());
}

export async function readReviewAuthor(cookieHeader: string | undefined): Promise<ReviewAuthorClaims | null> {
  const raw = cookieHeader?.split(";").map((s) => s.trim()).find((c) => c.startsWith(`${REVIEW_AUTHOR_COOKIE}=`));
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw.slice(REVIEW_AUTHOR_COOKIE.length + 1), secret(), { algorithms: ["HS256"] });
    if (typeof payload.providerId !== "string" || (payload.provider !== "google" && payload.provider !== "facebook")) return null;
    return payload as unknown as ReviewAuthorClaims;
  } catch {
    return null;
  }
}
