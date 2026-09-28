// SRS-009 — Budget Indicator
// Programmer: Annis Fakhiroh Akbar

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

type BudgetStatus = "belum_diset" | "aman" | "waspada" | "melebihi";

// GET /api/budgets/indicator?month=9&year=2026
// Hitung persentase & status pemakaian budget bulan tertentu milik user yang login.
export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json(
      { error: "Unauthorized: silakan login terlebih dahulu" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));

  if (!month || !year || month < 1 || month > 12) {
    return Response.json(
      { error: "Parameter month (1-12) dan year wajib diisi dan valid" },
      { status: 400 }
    );
  }

  // Ambil budget bulan yang dipilih + total pengeluaran bulan itu dalam
  // SATU db transaction, biar keduanya dibaca dari snapshot data yang sama
  // (konsisten, gak ada celah race condition kalau ada write di antaranya).
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startOfNextMonth = new Date(Date.UTC(year, month, 1));

  const [budget, expenseResult] = await prisma.$transaction([
    // 1. Budget bulan yang dipilih — userId dari session, bukan dari query.
    prisma.budget.findUnique({
      where: {
        userId_month_year: {
          userId: user.id,
          month,
          year,
        },
      },
    }),
    // 2. Total pengeluaran user pada bulan itu saja.
    prisma.transaction.aggregate({
      where: {
        userId: user.id,
        type: "expense",
        transactionDate: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
      _sum: { amount: true },
    }),
  ]);

  const totalExpense = Number(expenseResult._sum.amount ?? 0);

  // Belum ada budget yang diset untuk bulan ini -> gak bisa dihitung persentasenya.
  if (!budget) {
    return Response.json({
      month,
      year,
      hasBudget: false,
      budget: 0,
      totalExpense,
      remaining: 0,
      percentage: null,
      status: "belum_diset" satisfies BudgetStatus,
    });
  }

  const budgetAmount = Number(budget.amount);

  // 3. Persentase penggunaan budget.
  const percentage =
    budgetAmount > 0
      ? Math.round((totalExpense / budgetAmount) * 1000) / 10 // 1 desimal
      : 0;

  // 4. Status berdasarkan persentase.
  let status: BudgetStatus;
  if (percentage >= 100) {
    status = "melebihi";
  } else if (percentage >= 70) {
    status = "waspada";
  } else {
    status = "aman";
  }

  return Response.json({
    month,
    year,
    hasBudget: true,
    budget: budgetAmount,
    totalExpense,
    remaining: budgetAmount - totalExpense,
    percentage,
    status,
  });
}
