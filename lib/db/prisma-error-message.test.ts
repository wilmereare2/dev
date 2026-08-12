import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { isSchemaDriftError, mapPrismaErrorMessage } from "@/lib/db/prisma-error-message";

describe("mapPrismaErrorMessage", () => {
  it("maps unique constraint violations to friendly messages", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "test",
      meta: { target: ["username"] },
    });

    expect(mapPrismaErrorMessage(error)).toBe("That username is already taken.");
  });

  it("maps schema drift errors", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Column not found", {
      code: "P2022",
      clientVersion: "test",
    });

    expect(isSchemaDriftError(error)).toBe(true);
    expect(mapPrismaErrorMessage(error)).toContain("database is being updated");
  });
});
