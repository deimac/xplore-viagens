/**
 * Routers da Área do Cliente – clienteAuth / cliente / xp
 */
import { CLIENT_COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { publicProcedure, clienteProtectedProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { verifyGoogleToken } from "./_core/googleAuth";
import { verifyFacebookToken } from "./_core/facebookAuth";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";

// ── Helper: emitir cookie de sessão do cliente ────────────────────

async function emitClienteSessionCookie(
    ctx: { req: any; res: any },
    clienteId: number,
    nome: string
) {
    const secret = new TextEncoder().encode(ENV.cookieSecret);
    const token = await new SignJWT({ clienteId, nome })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setExpirationTime(ENV.jwtExpiresIn || "30d")
        .sign(secret);

    const cookieOptions = getSessionCookieOptions(ctx.req);
    const maxAgeMs = 30 * 24 * 60 * 60 * 1000; // 30 days
    ctx.res.cookie(CLIENT_COOKIE_NAME, token, { ...cookieOptions, maxAge: maxAgeMs });
}

// ── Helper: encontrar ou criar cliente por email ──────────────────

async function findOrCreateCliente(
    email: string,
    nome: string | null,
    origem: string
) {
    let cliente = await db.getClienteByEmail(email);
    if (!cliente) {
        const { id } = await db.createCliente({
            nome,
            email,
            origemCadastro: origem,
        });
        cliente = await db.getClienteById(id);
        // Garantir xp_contas existente
        await db.getOrCreateXpConta(id);
    }
    return cliente;
}

// ═══════════════════════════════════════════════════════════════════
// clienteAuth – cadastro e login do cliente
// ═══════════════════════════════════════════════════════════════════

export const clienteAuthRouter = router({
    // Cadastro por email/senha
    registerEmail: publicProcedure
        .input(
            z.object({
                nome: z.string().min(2),
                email: z.string().email(),
                senha: z.string().min(6),
            })
        )
        .mutation(async ({ input, ctx }) => {
            // Verificar se já existe
            const existing = await db.getClienteByEmail(input.email);
            if (existing) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Já existe uma conta com este email.",
                });
            }

            const passwordHash = await bcrypt.hash(input.senha, 10);
            const { id } = await db.createCliente({
                nome: input.nome,
                email: input.email,
                passwordHash,
                origemCadastro: "email",
            });

            await db.getOrCreateXpConta(id);
            const cliente = await db.getClienteById(id);

            await emitClienteSessionCookie(ctx, id, input.nome);

            return {
                success: true,
                cliente: {
                    id: cliente.id,
                    nome: cliente.nome,
                    email: cliente.email,
                    cadastroCompleto: !!cliente.cadastro_completo,
                },
            };
        }),

    // Login por email/senha
    loginEmail: publicProcedure
        .input(
            z.object({
                email: z.string().email(),
                senha: z.string(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const cliente = await db.getClienteByEmail(input.email);
            if (!cliente) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Email ou senha inválidos.",
                });
            }
            if (!cliente.password_hash) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Esta conta foi criada via login social. Use Google ou Facebook para entrar.",
                });
            }

            const ok = await bcrypt.compare(input.senha, cliente.password_hash);
            if (!ok) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Email ou senha inválidos.",
                });
            }

            await emitClienteSessionCookie(ctx, cliente.id, cliente.nome || "");

            return {
                success: true,
                cliente: {
                    id: cliente.id,
                    nome: cliente.nome,
                    email: cliente.email,
                    cadastroCompleto: !!cliente.cadastro_completo,
                },
            };
        }),

    // Login com Google
    loginGoogle: publicProcedure
        .input(z.object({ token: z.string() }))
        .mutation(async ({ input, ctx }) => {
            const userInfo = await verifyGoogleToken(input.token).catch(() => {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Falha ao verificar token do Google.",
                });
            });

            if (!userInfo.email) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Conta do Google não forneceu email.",
                });
            }

            const cliente = await findOrCreateCliente(
                userInfo.email,
                userInfo.name || null,
                "google"
            );

            await emitClienteSessionCookie(ctx, cliente.id, cliente.nome || "");

            return {
                success: true,
                cliente: {
                    id: cliente.id,
                    nome: cliente.nome,
                    email: cliente.email,
                    cadastroCompleto: !!cliente.cadastro_completo,
                },
            };
        }),

    // Login com Facebook
    loginFacebook: publicProcedure
        .input(z.object({ accessToken: z.string() }))
        .mutation(async ({ input, ctx }) => {
            const userInfo = await verifyFacebookToken(input.accessToken).catch(() => {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Falha ao verificar token do Facebook.",
                });
            });

            if (!userInfo.email) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Conta do Facebook não forneceu email.",
                });
            }

            const cliente = await findOrCreateCliente(
                userInfo.email,
                userInfo.name || null,
                "facebook"
            );

            await emitClienteSessionCookie(ctx, cliente.id, cliente.nome || "");

            return {
                success: true,
                cliente: {
                    id: cliente.id,
                    nome: cliente.nome,
                    email: cliente.email,
                    cadastroCompleto: !!cliente.cadastro_completo,
                },
            };
        }),

    // Logout
    logout: publicProcedure.mutation(({ ctx }) => {
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.clearCookie(CLIENT_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
        return { success: true } as const;
    }),
});

// ═══════════════════════════════════════════════════════════════════
// cliente – perfil e cadastro
// ═══════════════════════════════════════════════════════════════════

export const clienteRouter = router({
    me: publicProcedure.query(async ({ ctx }) => {
        if (!ctx.cliente) return null;
        const c = ctx.cliente;
        return {
            id: c.id,
            nome: c.nome,
            email: c.email,
            cpf: c.cpf,
            telefone: c.telefone,
            cep: c.cep,
            endereco: c.endereco,
            numero: c.numero,
            complemento: c.complemento,
            cidade: c.cidade,
            estado: c.estado,
            cadastroCompleto: !!c.cadastroCompleto,
        };
    }),

    completarCadastro: clienteProtectedProcedure
        .input(
            z.object({
                cpf: z.string().min(11).max(14),
                telefone: z.string().min(10).max(20),
                cep: z.string().min(8).max(10),
                endereco: z.string().min(3),
                numero: z.string().min(1),
                complemento: z.string().optional().nullable(),
                cidade: z.string().min(2),
                estado: z.string().length(2),
            })
        )
        .mutation(async ({ input, ctx }) => {
            try {
                await db.updateClienteCadastro(ctx.cliente!.id, input);
            } catch (err: any) {
                if (err?.code === "ER_DUP_ENTRY" && err?.message?.includes("cpf")) {
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: "Este CPF já está cadastrado no sistema.",
                    });
                }
                throw err;
            }
            return { success: true };
        }),
});

// ═══════════════════════════════════════════════════════════════════
// xp – dashboard, extrato, aplicar código
// ═══════════════════════════════════════════════════════════════════

export const xpRouter = router({
    dashboard: clienteProtectedProcedure.query(async ({ ctx }) => {
        await db.getOrCreateXpConta(ctx.cliente!.id);
        return await db.getXpDashboard(ctx.cliente!.id);
    }),

    extrato: clienteProtectedProcedure
        .input(
            z.object({
                dataInicio: z.string().optional(),
                dataFim: z.string().optional(),
                tipoMovimentacaoId: z.number().optional(),
                somenteQualificaveis: z.boolean().optional(),
                page: z.number().min(1).optional(),
                pageSize: z.union([z.literal(20), z.literal(50)]).optional(),
            }).optional()
        )
        .query(async ({ input, ctx }) => {
            return await db.getXpExtrato(ctx.cliente!.id, input || {});
        }),

    tiposMovimentacao: clienteProtectedProcedure.query(async () => {
        return await db.listTiposMovimentacao();
    }),

    aplicarCodigo: clienteProtectedProcedure
        .input(z.object({ codigo: z.string().min(1) }))
        .mutation(async ({ input, ctx }) => {
            try {
                const result = await db.aplicarCodigoPromocional(ctx.cliente!.id, input.codigo);
                return { success: true, ...result };
            } catch (err: any) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: err?.message || "Erro ao aplicar código.",
                });
            }
        }),
});
