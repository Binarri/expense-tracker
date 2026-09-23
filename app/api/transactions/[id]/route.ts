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
    const transaction = await checkTransactionOwnership(Number(id), user.id);

    return Response.json({ data: transaction });
  } catch (error) {
    return authErrorResponse(error);
  }
}

// PUT /api/transactions/[id] — Update transaksi by ID
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    // Cek kepemilikan sebelum update
    await checkTransactionOwnership(Number(id), user.id);

    const body = await request.json();

    // Validasi tipe transaksi
    if (body.type && !["income", "expense"].includes(body.type)) {
      return Response.json(
        { error: "Jenis transaksi tidak valid (income/expense)" },
        { status: 400 }
      );
    }

    const updated = await prisma.transaction.update({
      where: { id: Number(id) },
      data: {
        type: body.type,
        amount: body.amount,
        description: body.description,
        transactionDate: body.transactionDate
          ? new Date(body.transactionDate)
          : undefined,
      },
    });

    return Response.json({ data: updated });
  } catch (error) {
    return authErrorResponse(error);
  }
}

// DELETE /api/transactions/[id] — Hapus transaksi by ID
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    // Cek kepemilikan sebelum delete
    await checkTransactionOwnership(Number(id), user.id);

    await prisma.transaction.delete({
      where: { id: Number(id) },
    });

    return Response.json({ message: "Transaksi berhasil dihapus" });
  } catch (error) {
    return authErrorResponse(error);
  }
}
