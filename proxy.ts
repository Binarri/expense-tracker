import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * SRS-006: Lapis pertama proteksi route.
 * Proxy hanya bisa cek keberadaan cookie (tidak bisa query DB — itu di layer berikutnya).
 * Validasi DB tetap dilakukan di masing-masing server component / route handler.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionId = request.cookies.get("session_id")?.value;

  // Proteksi halaman dashboard — redirect ke /login kalau tidak ada cookie
  if (pathname.startsWith("/dashboard")) {
    if (!sessionId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Proteksi API transaksi — return 401 kalau tidak ada cookie
  if (pathname.startsWith("/api/transactions")) {
    if (!sessionId) {
      return NextResponse.json(
        { error: "Unauthorized: session tidak ditemukan" },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/transactions/:path*",
  ],
};
