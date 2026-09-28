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

export async function POST(request: Request) {
  try {
    // 1. Ambil user yang sedang login dari session
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    // 2. Ambil data dari request
    const body = await request.json();

    const amount = Number(body.amount);
    const month = Number(body.month);
    const year = Number(body.year);

    // 3. Validasi amount
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { message: "Amount harus berupa angka lebih dari 0." },
        { status: 400 }
      );
    }

    // 4. Validasi month
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { message: "Month harus berupa angka 1 sampai 12." },
        { status: 400 }
      );
    }

    // 5. Validasi year
    if (!Number.isInteger(year) || year < 2000) {
      return NextResponse.json(
        { message: "Year tidak valid." },
        { status: 400 }
      );
    }

    // 6. Buat budget baru atau update budget yang sudah ada
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

    // 7. Return response JSON
    return NextResponse.json(
      {
        message: "Budget berhasil disimpan.",
        budget: {
          id: budget.id,
          amount: budget.amount,
          month: budget.month,
          year: budget.year,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Set budget error:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}