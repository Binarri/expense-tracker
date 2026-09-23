import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import prisma from "@/lib/prisma";

export default async function DashboardPage() {
  // 1. Cek session — kalau tidak login, redirect ke /login
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // 2. Query aggregate: total income dan expense milik user ini SAJA
  const [incomeResult, expenseResult] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId: user.id, type: "income" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId: user.id, type: "expense" },
      _sum: { amount: true },
    }),
  ]);

  const totalIncome: Decimal = incomeResult._sum.amount ?? new Decimal(0);
  const totalExpense: Decimal = expenseResult._sum.amount ?? new Decimal(0);
  const balance: Decimal = totalIncome.minus(totalExpense);

  // 3. Query transaksi terbaru (5 terakhir) milik user ini SAJA
  const recentTransactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { transactionDate: "desc" },
    take: 5,
  });

  // 4. Helper format rupiah — Number() bisa langsung konversi Decimal dari Prisma
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatRupiah = (val: any) =>
    "Rp" + Number(val).toLocaleString("id-ID");

    // Tambahkan helper tanggal hari ini di atas return
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-slate-900 p-6 max-w-lg mx-auto">

      {/* Header: Greeting */}
      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-white">
          Halo, {user.name} 👋
        </h1>
        <p className="text-slate-400 mt-1 text-sm">{today}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-8">

        {/* Pemasukan */}
        <div className="bg-green-900/40 border border-green-800/50 rounded-xl p-3 flex flex-col justify-between min-h-[100px]">
          <span className="text-green-400 text-xl">↑</span>
          <div>
            <p className="text-slate-400 text-xs mb-1">Total Pemasukan</p>
            <p className="text-green-400 font-bold text-sm leading-tight">
              {formatRupiah(totalIncome)}
            </p>
          </div>
        </div>

        {/* Pengeluaran */}
        <div className="bg-red-900/40 border border-red-800/50 rounded-xl p-3 flex flex-col justify-between min-h-[100px]">
          <span className="text-red-400 text-xl">↓</span>
          <div>
            <p className="text-slate-400 text-xs mb-1">Total Pengeluaran</p>
            <p className="text-red-400 font-bold text-sm leading-tight">
              {formatRupiah(totalExpense)}
            </p>
          </div>
        </div>

        {/* Saldo */}
        <div className="bg-blue-900/40 border border-blue-800/50 rounded-xl p-3 flex flex-col justify-between min-h-[100px]">
          <span className="text-blue-400 text-xl">💼</span>
          <div>
            <p className="text-slate-400 text-xs mb-1">Saldo</p>
            <p className="text-blue-400 font-bold text-sm leading-tight">
              {formatRupiah(balance)}
            </p>
          </div>
        </div>

      </div>

      {/* Transaksi Terbaru */}
      <h2 className="text-xl font-bold text-white mb-4">Transaksi Terbaru</h2>

      {recentTransactions.length === 0 ? (
        <div className="text-center text-slate-500 py-12">
          <p className="text-4xl mb-2">📭</p>
          <p>Belum ada transaksi.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {recentTransactions.map((tx) => (
            <li
              key={tx.id}
              className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3"
            >
              {/* Kiri: dot + info */}
              <div className="flex items-center gap-3">
                <span
                  className={`w-3 h-3 rounded-full shrink-0 ${
                    tx.type === "income" ? "bg-green-400" : "bg-red-400"
                  }`}
                />
                <div>
                  <p className="text-white font-semibold text-sm">
                    {tx.description}
                  </p>
                  <p className="text-slate-400 text-xs">
                    {tx.transactionDate.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Kanan: nominal + type */}
              <div className="text-right">
                <p
                  className={`font-bold text-sm ${
                    tx.type === "income" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {formatRupiah(tx.amount)}
                </p>
                <p className="text-slate-500 text-xs capitalize">{tx.type}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}