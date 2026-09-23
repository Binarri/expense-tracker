import { cookies } from "next/headers";
import prisma from "./prisma";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
};

/**
 * Baca cookie session_id → query DB → return user yang login.
 * Return null kalau tidak ada session / session expired.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  // Cek session ada dan belum expired
  if (!session || session.expiresAt < new Date()) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  };
}