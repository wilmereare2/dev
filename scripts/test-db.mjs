import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const result = await prisma.$queryRaw`SELECT 1 as ok`;
  console.log("DATABASE_OK", JSON.stringify(result));
} catch (error) {
  console.error("DATABASE_FAIL", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
