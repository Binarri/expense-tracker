import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  requireAuth,
  checkTransactionOwnership,
  authErrorResponse,
} from "@/lib/auth";

/**
 * SRS-006: Contoh route handler transaksi dengan authorization lengkap.
 * Pola ini WAJIB diikuti Programmer 2 di semua endpoint CRUD transaksi.
 *
 * Alur authorization setiap request:
 * 1. Cek session → dapatkan current user
 * 2. Cek kepemilikan transaksi (userId di DB === userId dari session)
 * 3. Kalau bukan miliknya → tolak dengan 403
 * 4. Kalau miliknya → lanjutkan operasi
 */

// GET /api/transactions/[id] — Lihat transaksi by ID
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const transactionId = Number(id);

    if (Number.isNaN(transactionId)) {
      return Response.json(
        { error: "ID transaksi tidak valid" },
        { status: 400 }
      );
    }

    const transaction = await checkTransactionOwnership(
      transactionId,
      user.id
    );

    return Response.json({ data: transaction });
  } catch (error) {
    return authErrorResponse(error);
  }
}

// UPDATE — PUT /api/transactions/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transactionId = Number(id);

    if (Number.isNaN(transactionId)) {
      return NextResponse.json(
        { error: "ID transaksi tidak valid" },
        { status: 400 }
      );
    }

    const user = await requireAuth();

    // Cek kepemilikan sebelum update
    await checkTransactionOwnership(transactionId, user.id);

    const body = await request.json();
    const { type, amount, description, transactionDate } = body;

    // Validasi tipe transaksi
    if (type && type !== "income" && type !== "expense") {
      return NextResponse.json(
        { error: "Jenis transaksi harus income atau expense" },
        { status: 400 }
      );
    }

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        ...(type !== undefined && { type }),
        ...(amount !== undefined && { amount }),
        ...(description !== undefined && { description }),
        ...(transactionDate !== undefined && {
          transactionDate: new Date(transactionDate),
        }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return authErrorResponse(error);
  }
}

// DELETE — DELETE /api/transactions/:id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transactionId = Number(id);

    if (Number.isNaN(transactionId)) {
      return NextResponse.json(
        { error: "ID transaksi tidak valid" },
        { status: 400 }
      );
    }

    const user = await requireAuth();

    // Cek kepemilikan sebelum delete
    await checkTransactionOwnership(transactionId, user.id);

    await prisma.transaction.delete({
      where: { id: transactionId },
    });

    return NextResponse.json({
      message: "Transaksi dihapus",
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}