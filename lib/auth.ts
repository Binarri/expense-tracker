import prisma from "./prisma";
import { getCurrentUser, SessionUser } from "./session";

/**
 * SRS-006: Ambil user dari session, throw error kalau tidak valid.
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
 */
export async function checkTransactionOwnership(
  transactionId: number,
  userId: number
) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    throw new Error("NOT_FOUND");
  }

  if (transaction.userId !== userId) {
    throw new Error("FORBIDDEN");
  }

  return transaction;
}

/**
 * SRS-006: Helper konversi error ke HTTP response.
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

  return Response.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}