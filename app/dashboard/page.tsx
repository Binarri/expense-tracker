import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  // Guard auth di server — kalau tidak login, redirect ke /login.
  // Data ringkasan (income/expense/saldo/transaksi terbaru) diambil
  // belakangan lewat AJAX oleh DashboardClient, bukan di sini.
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <DashboardClient />;
}
