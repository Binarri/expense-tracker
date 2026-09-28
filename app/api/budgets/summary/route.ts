import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, authErrorResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const searchParams = request.nextUrl.searchParams;

    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    const now = new Date();

    const month = monthParam
      ? Number(monthParam)
      : now.getMonth() + 1;

    const year = yearParam
      ? Number(yearParam)
      : now.getFullYear();

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Bulan harus berupa angka 1 sampai 12" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: "Tahun tidak valid" },
        { status: 400 }
      );
    }

    const budget = await prisma.budget.findUnique({
      where: {
        userId_month_year: {
          userId: user.id,
          month,
          year,
        },
      },
    });

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    const expenseResult = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        type: "expense",
        transactionDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const totalExpense = Number(
      expenseResult._sum.amount ?? 0
    );

    if (!budget) {
      return NextResponse.json({
        budget: 0,
        totalExpense,
        remaining: 0 - totalExpense,
        month,
        year,
        hasBudget: false,
      });
    }

    const budgetAmount = Number(budget.amount);
    const remaining = budgetAmount - totalExpense;

    return NextResponse.json({
      budget: budgetAmount,
      totalExpense,
      remaining,
      month,
      year,
      hasBudget: true,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}