import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// GET /api/dashboard — Ringkasan keuangan (dipanggil via fetch() dari client)
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json(
      { error: "Unauthorized: silakan login terlebih dahulu" },
      { status: 401 }
    );
  }

  const [incomeResult, expenseResult, recentTransactions] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId: user.id, type: "income" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId: user.id, type: "expense" },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { transactionDate: "desc" },
      take: 5,
    }),
  ]);

  const totalIncome = Number(incomeResult._sum.amount ?? 0);
  const totalExpense = Number(expenseResult._sum.amount ?? 0);
  const balance = totalIncome - totalExpense;

  return Response.json({
    name: user.name,
    totalIncome,
    totalExpense,
    balance,
    recentTransactions: recentTransactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: Number(tx.amount),
      description: tx.description,
      transactionDate: tx.transactionDate,
    })),
  });
}
