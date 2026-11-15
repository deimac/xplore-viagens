import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";

const caller = () => appRouter.createCaller({ req: { headers: {} }, res: {}, user: { id: 1, role: "admin" }, cliente: null } as any);

describe("moderação no modo xplore360", () => {
  it("list, updateStatus e delete respondem FORBIDDEN", async () => {
    process.env.SHOWCASE_SOURCE = "xplore360";
    try {
      await expect(caller().reviews.list()).rejects.toMatchObject({ code: "FORBIDDEN", message: "Cadastro movido para o xplore360" });
      await expect(caller().reviews.updateStatus({ id: 1, status: "approved" })).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller().reviews.delete({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    } finally {
      delete process.env.SHOWCASE_SOURCE;
    }
  });
});

describe("reviews.create", () => {
  it("sem cookie de autor verificado recusa", async () => {
    const caller = appRouter.createCaller({ req: { headers: {} }, res: {}, user: null, cliente: null } as any);
    await expect(caller.reviews.create({ rating: 5, comment: "Excelente atendimento" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
