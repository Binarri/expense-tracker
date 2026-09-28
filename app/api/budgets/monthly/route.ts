// SRS-009 — Monthly Budget
// Programmer: Annis Fakhiroh Akbar

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// GET /api/budgets/monthly?month=9&year=2026
// Ambil budget milik user yang login untuk bulan & tahun tertentu.
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

  // userId selalu dari session, bukan dari query/body — user cuma bisa
  // baca budget miliknya sendiri.
  const budget = await prisma.budget.findUnique({
    where: {
      userId_month_year: {
        userId: user.id,
        month,
        year,
      },
    },
  });

  // Kalau belum pernah set budget di bulan itu, ini bukan error —
  // tetap 200 dengan hasBudget: false, biar UI gampang nampilin
  // state "belum ada budget" tanpa perlu nge-handle error khusus.
  return Response.json({
    month,
    year,
    hasBudget: Boolean(budget),
    amount: budget ? Number(budget.amount) : 0,
  });
}
