/**
 * Server-side OAuth redirect flows for Facebook and Google.
 *
 * Mobile browsers block popups and break user-gesture chains,
 * so the SDK-based popup login fails. These redirect routes
 * use the standard Authorization Code flow instead, which works
 * reliably on every browser including mobile.
 */
import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { SignJWT } from "jose";
import { CLIENT_COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { verifyGoogleToken } from "./googleAuth";
import * as db from "../db";

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || "2368392583585442";
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || "";
const GRAPH_API_VERSION = "v18.0";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

// ── Helpers ─────────────────────────────────────────────────────

function getBaseUrl(req: Request): string {
    const proto =
        (req.headers["x-forwarded-proto"] as string)?.split(",")[0]?.trim() ||
        req.protocol;
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    return `${proto}://${host}`;
}

function parseCookie(req: Request, name: string): string | undefined {
    const header = req.headers.cookie || "";
    const match = header
        .split(";")
        .map((s) => s.trim())
        .find((c) => c.startsWith(name + "="));
    return match ? match.substring(name.length + 1) : undefined;
}

async function emitSessionCookie(req: Request, res: Response, cliente: any) {
    const secret = new TextEncoder().encode(ENV.cookieSecret);
    const token = await new SignJWT({
        clienteId: cliente.id,
        nome: cliente.nome || "",
    })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setExpirationTime(ENV.jwtExpiresIn || "30d")
        .sign(secret);

    const cookieOptions = getSessionCookieOptions(req);
    const maxAgeMs = 30 * 24 * 60 * 60 * 1000; // 30 days
    res.cookie(CLIENT_COOKIE_NAME, token, { ...cookieOptions, maxAge: maxAgeMs });
}

async function findOrCreateCliente(
    email: string,
    nome: string | null,
    origem: string,
    avatarUrl: string | null
) {
    let cliente = await db.getClienteByEmail(email);
    if (!cliente) {
        const { id } = await db.createCliente({
            nome,
            email,
            origemCadastro: origem,
            avatarUrl,
        });
        cliente = await db.getClienteById(id);
        await db.getOrCreateXpConta(id);
    } else if (avatarUrl && cliente.avatar_url !== avatarUrl) {
        await db.updateClienteAvatar(cliente.id, avatarUrl);
        cliente = await db.getClienteById(cliente.id);
    }
    return cliente;
}

// ── Register routes ─────────────────────────────────────────────

export function registerOAuthRedirectRoutes(app: Express) {
    // ════════════════════════════════════════════════════════════════
    // Facebook OAuth redirect flow
    // ════════════════════════════════════════════════════════════════

    app.get("/api/auth/facebook", (req: Request, res: Response) => {
        const state = crypto.randomBytes(16).toString("hex");
        const baseUrl = getBaseUrl(req);
        const redirectUri = `${baseUrl}/api/auth/facebook/callback`;

        const isSecure =
            req.protocol === "https" ||
            (req.headers["x-forwarded-proto"] as string)?.includes("https");

        res.cookie("oauth_state_fb", state, {
            httpOnly: true,
            secure: isSecure,
            sameSite: "lax",
            maxAge: 5 * 60 * 1000,
            path: "/",
        });

        const authUrl =
            `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth` +
            `?client_id=${FACEBOOK_APP_ID}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&scope=public_profile,email` +
            `&state=${state}` +
            `&response_type=code`;

        res.redirect(authUrl);
    });

    app.get(
        "/api/auth/facebook/callback",
        async (req: Request, res: Response) => {
            try {
                const { code, state, error } = req.query;

                if (error) {
                    console.error("[Facebook OAuth] Denied:", error);
                    return res.redirect("/xp-club/login?error=facebook_denied");
                }

                // CSRF check
                const storedState = parseCookie(req, "oauth_state_fb");
                if (!state || state !== storedState) {
                    console.error("[Facebook OAuth] State mismatch");
                    return res.redirect("/xp-club/login?error=invalid_state");
                }
                res.clearCookie("oauth_state_fb", { path: "/" });

                const baseUrl = getBaseUrl(req);
                const redirectUri = `${baseUrl}/api/auth/facebook/callback`;

                // Exchange code → access_token
                const tokenUrl =
                    `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token` +
                    `?client_id=${FACEBOOK_APP_ID}` +
                    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                    `&client_secret=${encodeURIComponent(FACEBOOK_APP_SECRET)}` +
                    `&code=${encodeURIComponent(code as string)}`;

                const tokenRes = await fetch(tokenUrl);
                const tokenData = (await tokenRes.json()) as any;

                if (!tokenData.access_token) {
                    console.error("[Facebook OAuth] No access_token:", tokenData);
                    return res.redirect("/xp-club/login?error=facebook_token");
                }

                // Fetch profile
                const profileUrl =
                    `https://graph.facebook.com/${GRAPH_API_VERSION}/me` +
                    `?fields=id,name,email,picture.type(large)` +
                    `&access_token=${encodeURIComponent(tokenData.access_token)}`;

                const profileRes = await fetch(profileUrl);
                const profile = (await profileRes.json()) as any;

                if (!profile.email) {
                    console.error("[Facebook OAuth] No email in profile");
                    return res.redirect("/xp-club/login?error=facebook_no_email");
                }

                const avatarUrl: string | null =
                    profile.picture?.data?.url || null;

                const cliente = await findOrCreateCliente(
                    profile.email,
                    profile.name || null,
                    "facebook",
                    avatarUrl
                );

                await emitSessionCookie(req, res, cliente);
                res.redirect("/xp-club/dashboard");
            } catch (err) {
                console.error("[Facebook OAuth] Callback error:", err);
                res.redirect("/xp-club/login?error=facebook_error");
            }
        }
    );

    // ════════════════════════════════════════════════════════════════
    // Google OAuth redirect flow
    // ════════════════════════════════════════════════════════════════

    app.get("/api/auth/google", (req: Request, res: Response) => {
        const state = crypto.randomBytes(16).toString("hex");
        const baseUrl = getBaseUrl(req);
        const redirectUri = `${baseUrl}/api/auth/google/callback`;

        const isSecure =
            req.protocol === "https" ||
            (req.headers["x-forwarded-proto"] as string)?.includes("https");

        res.cookie("oauth_state_gg", state, {
            httpOnly: true,
            secure: isSecure,
            sameSite: "lax",
            maxAge: 5 * 60 * 1000,
            path: "/",
        });

        const authUrl =
            `https://accounts.google.com/o/oauth2/v2/auth` +
            `?client_id=${GOOGLE_CLIENT_ID}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent("openid email profile")}` +
            `&state=${state}` +
            `&access_type=offline` +
            `&prompt=select_account`;

        res.redirect(authUrl);
    });

    app.get(
        "/api/auth/google/callback",
        async (req: Request, res: Response) => {
            try {
                const { code, state, error } = req.query;

                if (error) {
                    console.error("[Google OAuth] Denied:", error);
                    return res.redirect("/xp-club/login?error=google_denied");
                }

                // CSRF check
                const storedState = parseCookie(req, "oauth_state_gg");
                if (!state || state !== storedState) {
                    console.error("[Google OAuth] State mismatch");
                    return res.redirect("/xp-club/login?error=invalid_state");
                }
                res.clearCookie("oauth_state_gg", { path: "/" });

                const baseUrl = getBaseUrl(req);
                const redirectUri = `${baseUrl}/api/auth/google/callback`;

                // Exchange code → tokens
                const tokenRes = await fetch(
                    "https://oauth2.googleapis.com/token",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                        body: new URLSearchParams({
                            code: code as string,
                            client_id: GOOGLE_CLIENT_ID,
                            client_secret: GOOGLE_CLIENT_SECRET,
                            redirect_uri: redirectUri,
                            grant_type: "authorization_code",
                        }),
                    }
                );
                const tokenData = (await tokenRes.json()) as any;

                if (!tokenData.id_token) {
                    console.error("[Google OAuth] No id_token:", tokenData);
                    return res.redirect("/xp-club/login?error=google_token");
                }

                // Reuse existing verifyGoogleToken (validates audience etc.)
                const userInfo = await verifyGoogleToken(tokenData.id_token);

                if (!userInfo.email) {
                    return res.redirect("/xp-club/login?error=google_no_email");
                }

                const cliente = await findOrCreateCliente(
                    userInfo.email,
                    userInfo.name || null,
                    "google",
                    userInfo.picture || null
                );

                await emitSessionCookie(req, res, cliente);
                res.redirect("/xp-club/dashboard");
            } catch (err) {
                console.error("[Google OAuth] Callback error:", err);
                res.redirect("/xp-club/login?error=google_error");
            }
        }
    );
}
