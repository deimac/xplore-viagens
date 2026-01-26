import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";
import crypto from "crypto";
import { verifyGoogleToken } from "./_core/googleAuth";
import { SignJWT } from "jose";
import bcrypt from 'bcryptjs';
import { authenticateIddas, getAeroportos, getAllAeroportos, getVendas, getPessoas, getOrcamento } from "./_core/iddasApi";


export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // authenticate against users table
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }
        if (!user.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }
        const ok = await bcrypt.compare(input.password, user.passwordHash);
        if (!ok) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }
        if (user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        const secret = new TextEncoder().encode(ENV.cookieSecret);
        const token = await new SignJWT({ id: user.id, email: user.email, role: user.role, name: user.name || "" })
          .setProtectedHeader({ alg: "HS256", typ: "JWT" })
          .setExpirationTime(ENV.jwtExpiresIn || "7d")
          .sign(secret);

        const cookieOptions = getSessionCookieOptions(ctx.req);
        const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: maxAgeMs });
        try {
          console.log(`[Auth] Set cookie ${COOKIE_NAME} for user=${user.email} secure=${cookieOptions.secure} sameSite=${cookieOptions.sameSite}`);
        } catch (e) {
          // ignore
        }

        return { success: true } as const;
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  travels: router({
    list: publicProcedure.query(async () => {
      return await db.getAllTravels();
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getTravelById(input.id);
      }),
    create: publicProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string(),
          origin: z.string(),
          departureDate: z.string().optional(),
          returnDate: z.string().optional(),
          travelers: z.string().optional(),
          price: z.string(),
          imageUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createTravel(input);
      }),
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          origin: z.string().optional(),
          departureDate: z.string().optional(),
          returnDate: z.string().optional(),
          travelers: z.string().optional(),
          price: z.string().optional(),
          imageUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTravel(id, data);
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTravel(input.id);
        return { success: true };
      }),
  }),

  categories: router({
    list: publicProcedure.query(async () => {
      return await db.getAllCategories();
    }),
    create: publicProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          icon: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createCategory(input);
      }),
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          icon: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCategory(id, data);
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCategory(input.id);
        return { success: true };
      }),
  }),

  companySettings: router({
    get: publicProcedure.query(async () => {
      return await db.getCompanySettings();
    }),
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          companyName: z.string().optional(),
          cnpj: z.string().optional(),
          foundedDate: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          whatsapp: z.string().optional(),
          instagram: z.string().optional(),
          facebook: z.string().optional(),
          linkedin: z.string().optional(),
          twitter: z.string().optional(),
          quotationLink: z.string().optional(),
          googleAnalyticsId: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...settings } = input;
        await db.updateCompanySettings(id, settings);
        return { success: true };
      }),
  }),

  heroSlides: router({
    list: publicProcedure.query(async () => {
      return await db.getAllHeroSlides();
    }),
    listActive: publicProcedure.query(async () => {
      return await db.getActiveHeroSlides();
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getHeroSlideById(input.id);
      }),
    create: publicProcedure
      .input(
        z.object({
          imageUrl: z.string(),
          title: z.string(),
          subtitle: z.string().optional(),
          order: z.number().default(0),
          isActive: z.number().default(1),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createHeroSlide(input);
      }),
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          imageUrl: z.string().optional(),
          title: z.string().optional(),
          subtitle: z.string().optional(),
          order: z.number().optional(),
          isActive: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateHeroSlide(id, data);
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteHeroSlide(input.id);
        return { success: true };
      }),
    uploadImage: publicProcedure
      .input(
        z.object({
          fileName: z.string(),
          fileData: z.string(),
          mimeType: z.string(),
        })
      )
      .mutation(async ({ input }) => {

        const buffer = Buffer.from(input.fileData, "base64");
        const randomSuffix = crypto.randomBytes(8).toString("hex");
        const ext = input.fileName.split(".").pop() || "jpg";
        const fileKey = `hero-slides/${randomSuffix}.${ext}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        return { url };
      }),
  }),

  quotations: router({
    create: publicProcedure
      .input(
        z.object({
          name: z.string(),
          email: z.string().email(),
          phone: z.string().optional(),
          destination: z.string(),
          departureDate: z.string().optional(),
          returnDate: z.string().optional(),
          travelers: z.number(),
          budget: z.string().optional(),
          message: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createQuotation({
          ...input,
          status: "pending",
        });
      }),
    list: adminProcedure.query(async ({ ctx }) => {
      return await db.getAllQuotations();
    }),
    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "contacted", "completed", "cancelled"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateQuotationStatus(input.id, input.status);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteQuotation(input.id);
        return { success: true };
      }),
  }),

  reviews: router({
    // Verify Google token and return user info
    verifyGoogle: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const userInfo = await verifyGoogleToken(input.token);

          // Upsert review author
          const author = await db.upsertReviewAuthor({
            googleId: userInfo.googleId,
            name: userInfo.name,
            email: userInfo.email,
            avatarUrl: userInfo.picture,
          });

          return {
            success: true,
            author: {
              id: author.id,
              name: author.name,
              email: author.email,
              avatarUrl: author.avatarUrl,
            },
          };
        } catch (error) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Failed to verify Google token",
          });
        }
      }),

    // Create a new review
    create: publicProcedure
      .input(
        z.object({
          authorId: z.number(),
          rating: z.number().min(1).max(5),
          comment: z.string().min(10),
        })
      )
      .mutation(async ({ input }) => {
        await db.createReview({
          ...input,
          status: "pending", // All reviews start as pending
        });
        return { success: true };
      }),

    // List all reviews (admin only)
    list: adminProcedure.query(async ({ ctx }) => {
      const reviews = await db.getAllReviews();
      try {
        console.log(`[Admin Debug] reviews.list called by user=${ctx.user?.id}-${ctx.user?.email} role=${ctx.user?.role} reviews_count=${Array.isArray(reviews) ? reviews.length : 'unknown'}`);
      } catch (e) {
        // ignore logging failures
      }
      return reviews;
    }),

    // List approved reviews (public)
    listApproved: publicProcedure.query(async () => {
      return await db.getApprovedReviews();
    }),

    // Update review status (admin only)
    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "approved", "rejected"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateReviewStatus(input.id, input.status);
        return { success: true };
      }),

    // Delete review (admin only)
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteReview(input.id);
        return { success: true };
      }),
  }),

  // Iddas CRM API Routes
  iddas: router({
    // Test authentication and get token
    auth: publicProcedure.query(async () => {
      try {
        const token = await authenticateIddas();
        return {
          success: true,
          token,
          message: "Authentication successful",
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to authenticate with Iddas API",
        });
      }
    }),

    // Get airports list with pagination
    aeroportos: publicProcedure
      .input(
        z.object({
          page: z.number().min(1).default(1),
          perPage: z.number().min(1).max(100).default(10),
        }).optional()
      )
      .query(async ({ input }) => {
        try {
          const token = await authenticateIddas();
          const result = await getAeroportos(
            token,
            input?.page || 1,
            input?.perPage || 10
          );
          return result;
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Failed to fetch airports from Iddas API",
          });
        }
      }),

    // Get all airports (no pagination)
    allAeroportos: publicProcedure.query(async () => {
      try {
        const aeroportos = await getAllAeroportos();
        return {
          data: aeroportos,
          total: aeroportos.length,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to fetch all airports from Iddas API",
        });
      }
    }),

    // Get sales (vendas) from Iddas API
    vendas: publicProcedure
      .input(
        z.object({
          codigo: z.string().optional(),
          dataInicial: z.string().optional(),
          dataFinal: z.string().optional(),
          cliente: z.number().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        try {
          const token = await authenticateIddas();
          const result = await getVendas(
            token,
            input?.codigo,
            input?.dataInicial,
            input?.dataFinal,
            input?.cliente
          );
          return result;
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Failed to fetch sales from Iddas API",
          });
        }
      }),

    // Get pessoas from Iddas API
    pessoas: publicProcedure
      .input(
        z.object({
          cpfCnpj: z.string().optional(),
          id: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        try {
          const token = await authenticateIddas();
          const result = await getPessoas(token, input?.cpfCnpj, input?.id);
          return result;
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Failed to fetch pessoas from Iddas API",
          });
        }
      }),

    // Get orcamento from Iddas API
    orcamento: publicProcedure
      .input(
        z.object({
          id: z.string().optional(),
          pessoaId: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        try {
          const token = await authenticateIddas();
          const result = await getOrcamento(token, input?.id, input?.pessoaId);
          return result;
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Failed to fetch orcamento from Iddas API",
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
