import { PrismaClient } from "@prisma/client";
import { scryptSync } from "crypto";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.izziuwmjgulrcwbxzimo:ScaNia%256834@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
    }
  }
});

async function main() {
  const users = await prisma.user.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      passwordHash: true,
    }
  });

  console.log("Users in Supabase:", JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
