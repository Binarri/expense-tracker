// SRS-007 — Set Budget
// Programmer: Shafa Aqilla Zahira
//
// TODO:
// 1. Ambil user yang sedang login dari session.
// 2. Buat endpoint untuk membuat/menetapkan budget bulanan.
// 3. Jika budget untuk user + bulan + tahun tersebut sudah ada,
//    lakukan update terhadap budget tersebut.
// 4. Jangan menerima userId dari request sebagai sumber kepemilikan.
// 5. userId harus berasal dari session.
// 6. Validasi amount, month, dan year.
// 7. Gunakan Prisma untuk menyimpan budget.
// 8. Return response dalam format JSON.
// 9. Endpoint harus dapat dipanggil menggunakan AJAX/fetch.
// 10. Pastikan user hanya dapat mengelola budget miliknya sendiri.

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// GET: mengambil budget berdasarkan bulan dan tahun
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const month = Number(searchParams.get("month"));
    const year = Number(searchParams.get("year"));

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { message: "Month harus berupa angka 1 sampai 12." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(year) || year < 2000) {
      return NextResponse.json(
        { message: "Year tidak valid." },
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

    if (!budget) {
      return NextResponse.json({
        budget: null,
      });
    }

    return NextResponse.json({
      budget: {
        id: budget.id,
        amount: Number(budget.amount),
        month: budget.month,
        year: budget.year,
      },
    });
  } catch (error) {
    console.error("Get budget error:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

// POST: membuat atau mengubah budget
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const amount = Number(body.amount);
    const month = Number(body.month);
    const year = Number(body.year);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { message: "Amount harus berupa angka lebih dari 0." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { message: "Month harus berupa angka 1 sampai 12." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(year) || year < 2000) {
      return NextResponse.json(
        { message: "Year tidak valid." },
        { status: 400 }
      );
    }

    const budget = await prisma.budget.upsert({
      where: {
        userId_month_year: {
          userId: user.id,
          month,
          year,
        },
      },
      update: {
        amount,
      },
      create: {
        userId: user.id,
        amount,
        month,
        year,
      },
    });

    return NextResponse.json({
      message: "Budget berhasil disimpan.",
      budget: {
        id: budget.id,
        amount: Number(budget.amount),
        month: budget.month,
        year: budget.year,
      },
    });
  } catch (error) {
    console.error("Set budget error:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}