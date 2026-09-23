import prisma from "./prisma";
import { getCurrentUser, SessionUser } from "./session";

/**
 * SRS-006: Ambil user dari session, throw error kalau tidak valid.
 * Dipakai di setiap route handler / server action yang butuh autentikasi.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

/**
 * SRS-006: Cek kepemilikan transaksi.
 * Pastikan transaksi dengan transactionId itu memang milik userId yang sedang login.
 * Return transaksinya kalau valid, throw error kalau tidak.
 */
export async function checkTransactionOwnership(
  transactionId: number,
  userId: number
) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  // Transaksi tidak ditemukan
  if (!transaction) {
    throw new Error("NOT_FOUND");
  }

  // Transaksi ada tapi bukan milik user yang login
  if (transaction.userId !== userId) {
    throw new Error("FORBIDDEN");
  }

  return transaction;
}

/**
 * SRS-006: Helper konversi error code ke HTTP response.
 * Dipakai di route handler untuk return response yang konsisten.
 */
export function authErrorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message : "UNKNOWN";

  if (message === "UNAUTHORIZED") {
    return Response.json(
      { error: "Unauthorized: silakan login terlebih dahulu" },
      { status: 401 }
    );
  }

  if (message === "FORBIDDEN") {
    return Response.json(
      { error: "Forbidden: transaksi ini bukan milikmu" },
      { status: 403 }
    );
  }

  if (message === "NOT_FOUND") {
    return Response.json(
      { error: "Transaksi tidak ditemukan" },
      { status: 404 }
    );
  }

  return Response.json({ error: "Internal server error" }, { status: 500 });
}
