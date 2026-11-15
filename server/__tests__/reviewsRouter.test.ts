import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";

describe("reviews.create", () => {
  it("sem cookie de autor verificado recusa", async () => {
    const caller = appRouter.createCaller({ req: { headers: {} }, res: {}, user: null, cliente: null } as any);
    await expect(caller.reviews.create({ rating: 5, comment: "Excelente atendimento" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
