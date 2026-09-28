import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "binar@test.com";
  const password = "password123";

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword },
    create: {
      name: "Binar",
      email,
      password: hashedPassword,
    },
  });

  // Bersihkan transaksi lama punya user ini biar seed bisa dijalankan berkali-kali
  await prisma.transaction.deleteMany({ where: { userId: user.id } });

  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        type: "income",
        amount: 3500000,
        description: "Gaji bulanan",
        transactionDate: new Date("2026-09-01"),
      },
      {
        userId: user.id,
        type: "income",
        amount: 500000,
        description: "Freelance desain",
        transactionDate: new Date("2026-09-10"),
      },
      {
        userId: user.id,
        type: "expense",
        amount: 1200000,
        description: "Sewa kos",
        transactionDate: new Date("2026-09-03"),
      },
      {
        userId: user.id,
        type: "expense",
        amount: 250000,
        description: "Belanja bulanan",
        transactionDate: new Date("2026-09-12"),
      },
      {
        userId: user.id,
        type: "expense",
        amount: 75000,
        description: "Makan siang",
        transactionDate: new Date("2026-09-20"),
      },
      {
        userId: user.id,
        type: "expense",
        amount: 45000,
        description: "Ojek online",
        transactionDate: new Date("2026-09-24"),
      },
    ],
  });

  console.log("Seed selesai.");
  console.log(`User: ${email} / password: ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
