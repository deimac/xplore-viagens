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
import { parsearOfertaVoo } from "./ofertasVoo";
import * as properties from "./properties";


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

  ofertasVoo: router({
    listActive: publicProcedure.query(async () => {
      const ofertas = await db.getActiveOfertasVoo();
      if (!ofertas.length) return [];

      const ofertaIds = ofertas.map((oferta) => oferta.id);
      const datasFixas = await db.getOfertasDatasFixasByOfertaIds(ofertaIds);
      const datasFlexiveis = await db.getOfertasDatasFlexiveisByOfertaIds(ofertaIds);

      const parsed = ofertas.map((oferta) => {
        try {
          const fixas = datasFixas.filter((item) => item.ofertaId === oferta.id);
          const flexiveis = datasFlexiveis.filter((item) => item.ofertaId === oferta.id);
          return parsearOfertaVoo(oferta, fixas, flexiveis);
        } catch (error) {
          console.warn("[ofertasVoo] Oferta inválida ignorada:", oferta?.id, error);
          return null;
        }
      });

      return parsed.filter((item): item is ReturnType<typeof parsearOfertaVoo> => Boolean(item));
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

  properties: router({
    // Públicas
    listActive: publicProcedure.query(async () => {
      return await properties.getActivePropertiesGroupedByCity();
    }),

    listFeatured: publicProcedure.query(async () => {
      return await db.getFeaturedProperties();
    }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const property = await properties.getPropertyWithDetails(input.slug);
        if (!property) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Property not found" });
        }
        return property;
      }),

    // Administrativas
    listAll: adminProcedure.query(async () => {
      return await db.getAllPropertiesAdmin();
    }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const property = await db.getPropertyById(input.id);
        if (!property) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Property not found" });
        }

        const [images, amenities] = await Promise.all([
          db.getPropertyImages(property.id),
          db.getPropertyAmenities(property.id),
        ]);

        return {
          ...property,
          images,
          amenities,
        };
      }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string(),
          description_short: z.string().optional(),
          description_full: z.string().optional(),
          property_type_id: z.number().optional(),
          address_street: z.string().optional(),
          address_number: z.string().optional(),
          address_complement: z.string().optional(),
          neighborhood: z.string().optional(),
          city: z.string(),
          state_region: z.string().optional(),
          country: z.string(),
          postal_code: z.string().optional(),
          max_guests: z.number(),
          bedrooms: z.number(),
          beds: z.number(),
          bathrooms: z.number(),
          area_m2: z.number().optional(),
          is_featured: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await properties.createProperty(input);
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description_short: z.string().optional(),
          description_full: z.string().optional(),
          property_type_id: z.number().optional(),
          address_street: z.string().optional(),
          address_number: z.string().optional(),
          address_complement: z.string().optional(),
          neighborhood: z.string().optional(),
          city: z.string().optional(),
          state_region: z.string().optional(),
          country: z.string().optional(),
          postal_code: z.string().optional(),
          max_guests: z.number().optional(),
          bedrooms: z.number().optional(),
          beds: z.number().optional(),
          bathrooms: z.number().optional(),
          area_m2: z.number().optional(),
          is_featured: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await properties.updateProperty(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteProperty(input.id);
      }),

    toggleActive: adminProcedure
      .input(z.object({ id: z.number(), active: z.boolean() }))
      .mutation(async ({ input }) => {
        return await properties.updateProperty(input.id, { active: input.active });
      }),

    uploadImages: adminProcedure
      .input(
        z.object({
          propertyId: z.number(),
          images: z.array(
            z.object({
              fileName: z.string(),
              fileData: z.string(),
              mimeType: z.string(),
              is_primary: z.boolean(),
              sort_order: z.number(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const uploadedImages = [];

        for (const image of input.images) {
          const buffer = Buffer.from(image.fileData, "base64");
          const randomSuffix = crypto.randomBytes(8).toString("hex");
          const ext = image.fileName.split(".").pop() || "jpg";
          const fileKey = `properties/${input.propertyId}/${randomSuffix}.${ext}`;
          const { url } = await storagePut(fileKey, buffer, image.mimeType);

          uploadedImages.push({
            property_id: input.propertyId,
            image_url: url,
            is_primary: image.is_primary,
            sort_order: image.sort_order,
          });
        }

        return await properties.savePropertyImages(input.propertyId, uploadedImages);
      }),

    updateImages: adminProcedure
      .input(
        z.object({
          propertyId: z.number(),
          toDelete: z.array(z.number()).optional(),
          toAdd: z.array(
            z.object({
              fileName: z.string(),
              fileData: z.string(),
              mimeType: z.string(),
              is_primary: z.boolean(),
              sort_order: z.number(),
            })
          ).optional(),
          toUpdate: z.array(
            z.object({
              id: z.number(),
              is_primary: z.boolean().optional(),
              sort_order: z.number().optional(),
            })
          ).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { propertyId, toDelete, toAdd, toUpdate } = input;
        const uploadedImages = [];

        // Upload new images if any
        if (toAdd && toAdd.length > 0) {
          for (const image of toAdd) {
            const buffer = Buffer.from(image.fileData, "base64");
            const randomSuffix = crypto.randomBytes(8).toString("hex");
            const ext = image.fileName.split(".").pop() || "jpg";
            const fileKey = `properties/${propertyId}/${randomSuffix}.${ext}`;
            const { url } = await storagePut(fileKey, buffer, image.mimeType);

            uploadedImages.push({
              image_url: url,
              is_primary: image.is_primary,
              sort_order: image.sort_order,
            });
          }
        }

        return await db.updatePropertyImages(propertyId, {
          toDelete,
          toAdd: uploadedImages,
          toUpdate,
        });
      }),
  }),

  propertyTypes: router({
    list: publicProcedure.query(async () => {
      return await db.getAllPropertyTypes();
    }),
  }),

  amenities: router({
    list: publicProcedure.query(async () => {
      return await db.getAllAmenities();
    }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string(),
          icon: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await properties.createAmenity(input);
      }),

    associate: adminProcedure
      .input(
        z.object({
          propertyId: z.number(),
          amenityIds: z.array(z.number()),
        })
      )
      .mutation(async ({ input }) => {
        return await properties.associatePropertyAmenities(input.propertyId, input.amenityIds);
      }),
  }),

  // Geocoding - Only called explicitly from admin
  geocoding: router({
    geocodeProperty: adminProcedure
      .input(
        z.object({
          address_street: z.string().optional(),
          address_number: z.string().optional(),
          neighborhood: z.string().optional(),
          city: z.string(),
          state_region: z.string().optional(),
          country: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { geocodeAddress, buildAddressString } = await import('./geocoding');

        const addressString = buildAddressString(input);
        const result = await geocodeAddress(addressString);

        return {
          latitude: result.latitude,
          longitude: result.longitude,
          formattedAddress: result.formattedAddress,
          addressString,
        };
      }),
  }),

  // Room Types
  roomTypes: router({
    list: publicProcedure.query(async () => {
      return await db.getAllRoomTypes();
    }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createRoomType(input);
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateRoomType(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteRoomType(input.id);
      }),
  }),

  // Bed Types
  bedTypes: router({
    list: publicProcedure.query(async () => {
      return await db.getAllBedTypes();
    }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string(),
          sleepsCount: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createBedType(input);
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          sleepsCount: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateBedType(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteBedType(input.id);
      }),
  }),

  // Property Rooms
  propertyRooms: router({
    listByProperty: publicProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPropertyRooms(input.propertyId);
      }),

    listWithBeds: publicProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPropertyRoomsWithBeds(input.propertyId);
      }),

    create: adminProcedure
      .input(
        z.object({
          propertyId: z.number(),
          roomTypeId: z.number(),
          name: z.string().optional(),
          displayOrder: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createPropertyRoom(input);
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          roomTypeId: z.number().optional(),
          name: z.string().optional(),
          displayOrder: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updatePropertyRoom(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deletePropertyRoom(input.id);
      }),

    reorder: adminProcedure
      .input(
        z.object({
          propertyId: z.number(),
          roomIds: z.array(z.number()),
        })
      )
      .mutation(async ({ input }) => {
        return await db.reorderPropertyRooms(input.propertyId, input.roomIds);
      }),

    uploadPhoto: adminProcedure
      .input(
        z.object({
          roomId: z.number(),
          propertyId: z.number(),
          imageData: z.string(), // base64 encoded image
        })
      )
      .mutation(async ({ input }) => {
        const storage = await import('./storage');

        // Convert base64 to buffer
        const base64Data = input.imageData.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Get current room to delete old photo if exists
        const rooms = await db.getPropertyRooms(input.propertyId);
        const room = rooms.find((r: any) => r.id === input.roomId);

        if (room?.sleepingPhoto) {
          await storage.deleteRoomPhoto(room.sleepingPhoto);
        }

        // Store new photo
        const result = await storage.storeRoomPhoto(input.propertyId, input.roomId, imageBuffer);

        // Update database
        await db.updatePropertyRoom(input.roomId, { sleepingPhoto: result.url });

        return { url: result.url };
      }),

    deletePhoto: adminProcedure
      .input(z.object({ roomId: z.number(), propertyId: z.number() }))
      .mutation(async ({ input }) => {
        const storage = await import('./storage');

        // Get current room photo
        const rooms = await db.getPropertyRooms(input.propertyId);
        const room = rooms.find((r: any) => r.id === input.roomId);

        if (room?.sleepingPhoto) {
          await storage.deleteRoomPhoto(room.sleepingPhoto);
          await db.updatePropertyRoom(input.roomId, { sleepingPhoto: null });
        }

        return { success: true };
      }),
  }),

  // Room Beds
  roomBeds: router({
    listByRoom: publicProcedure
      .input(z.object({ roomId: z.number() }))
      .query(async ({ input }) => {
        return await db.getRoomBeds(input.roomId);
      }),

    create: adminProcedure
      .input(
        z.object({
          roomId: z.number(),
          bedTypeId: z.number(),
          quantity: z.number().min(1),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createRoomBed(input);
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          bedTypeId: z.number().optional(),
          quantity: z.number().min(1).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateRoomBed(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteRoomBed(input.id);
      }),
  }),
});

